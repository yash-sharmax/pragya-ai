import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PersonaId } from "@/lib/personas";
import { routeAiRequest, ChatMessageInput } from "@/lib/ai/router";
import { generateConversationTitle } from "@/lib/ai/title";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const startTime = Date.now();
  const supabase = createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: at most 20 chat requests per minute per user.
  // Protects the Gemini/Groq quota from loops and abuse.
  if (!checkRateLimit(`chat:${user.id}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few seconds and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const {
      content,
      personaId = "veda",
      conversationId: existingConversationId,
      attachment, // { fileName, filePath, fileSize, mimeType, base64, extractedText, isScanned }
      isRetry = false,
      existingUserMessageId,
      stream = false,
    } = body;

    const acceptHeader = request.headers.get("accept") || "";
    const wantsStream = stream || acceptHeader.includes("text/event-stream");

    if (!content && !attachment) {
      return NextResponse.json({ error: "Message content or attachment is required." }, { status: 400 });
    }

    // 2. Fetch user settings
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("preferred_language, save_chat_history")
      .eq("user_id", user.id)
      .single();

    const saveHistory = userSettings?.save_chat_history ?? true;
    const preferredLanguage = userSettings?.preferred_language || "en";

    // 3. Ensure conversation exists or create new one
    let conversationId = existingConversationId;
    let isNewConversation = false;

    if (!conversationId) {
      isNewConversation = true;
      const initialTitle = content
        ? content.slice(0, 36) + (content.length > 36 ? "..." : "")
        : attachment?.fileName
        ? attachment.fileName.slice(0, 36)
        : "Knowledge Inquiry";

      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: initialTitle,
          persona: personaId,
        })
        .select()
        .single();

      if (convError || !newConv) {
        throw new Error(convError?.message || "Failed to create conversation.");
      }
      conversationId = newConv.id;
    } else {
      // SEC-02: Verify conversation exists and belongs to the authenticated user
      const { data: existingConv, error: checkConvError } = await supabase
        .from("conversations")
        .select("id, user_id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (checkConvError || !existingConv) {
        return NextResponse.json(
          { error: "Conversation not found or unauthorized access." },
          { status: 404 }
        );
      }

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId)
        .eq("user_id", user.id);
    }

    // 4. Handle User Message (Save as pending or reuse on retry)
    let userMessageId: string | null = null;
    if (saveHistory) {
      if (isRetry && existingUserMessageId) {
        // Reuse existing message without duplicating in the database
        userMessageId = existingUserMessageId;
        await supabase
          .from("messages")
          .update({ status: "pending", error_message: null })
          .eq("id", existingUserMessageId)
          .eq("user_id", user.id);
      } else {
        const fallbackContent = attachment?.fileName
          ? `Uploaded ${attachment.fileName}`
          : "Uploaded document";

        const { data: savedUserMsg, error: userMsgErr } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "user",
            content: content || fallbackContent,
            status: "pending",
          })
          .select()
          .single();

        if (!userMsgErr && savedUserMsg) {
          userMessageId = savedUserMsg.id;

          // If attachment present, record attachment metadata in database
          if (attachment && attachment.filePath) {
            await supabase.from("attachments").insert({
              user_id: user.id,
              conversation_id: conversationId,
              message_id: userMessageId,
              file_name: attachment.fileName,
              file_path: attachment.filePath,
              file_size: attachment.fileSize,
              mime_type: attachment.mimeType,
            });
          }
        }
      }
    }

    // 5. Build Conversation Context
    const messagesContext: ChatMessageInput[] = [];

    if (saveHistory && conversationId) {
      const { data: previousMessages } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .eq("status", "completed")
        .order("created_at", { ascending: true })
        .limit(10);

      if (previousMessages && previousMessages.length > 0) {
        for (const pm of previousMessages) {
          // If retrying, omit the retried user message from historical context since it is appended below
          if (isRetry && pm.id === existingUserMessageId) continue;
          messagesContext.push({
            role: pm.role as "user" | "assistant",
            content: pm.content,
          });
        }
      }
    }

    // Format current user message content incorporating extracted document text
    let formattedUserContent = content || "";
    if (attachment && attachment.extractedText) {
      const isScannedNotice = attachment.isScanned
        ? "\n[Notice: Scanned document without an OCR text layer. Content is based on available text.]\n"
        : "";
      formattedUserContent = `[Attached Document: ${attachment.fileName}${isScannedNotice}]\n${attachment.extractedText.slice(
        0,
        30000
      )}\n\n${content || "Please examine and explain this document based on your persona expertise."}`;
    } else if (!formattedUserContent && attachment) {
      formattedUserContent = "Please analyze this attached file according to your persona expertise.";
    }

    // Add current user message with image/document representation
    messagesContext.push({
      role: "user",
      content: formattedUserContent,
      imageBase64: attachment?.base64,
      imageMime: attachment?.mimeType,
    });

    // Helper to finalize dynamic title
    const getDynamicTitle = async (): Promise<string | undefined> => {
      const titlePrompt = content || (attachment?.fileName ? `Document: ${attachment.fileName}` : "");
      if (isNewConversation && titlePrompt) {
        try {
          const candidateTitle = await generateConversationTitle(titlePrompt);
          const { data: updatedConv } = await supabase
            .from("conversations")
            .update({
              title: candidateTitle,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .eq("title_customized", false)
            .select("title")
            .single();

          if (updatedConv) {
            return updatedConv.title;
          }
        } catch (titleErr) {
          console.warn("Background title generation failed:", titleErr);
        }
      }
      return undefined;
    };

    // 6. Handle SSE Streaming Response if requested
    if (wantsStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: any) => {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            sendEvent("status", {
              status: attachment?.extractedText ? "Processing document..." : "Thinking...",
              step: "thinking",
            });

            const aiResult = await routeAiRequest(
              personaId as PersonaId,
              messagesContext,
              preferredLanguage,
              (status) => {
                sendEvent("status", { status });
              }
            );

            const responseTimeMs = Date.now() - startTime;

            // Stream text in realistic progressive chunks for Kalam writing animation
            sendEvent("status", { status: "Writing on manuscript..." });

            const fullText = aiResult.text || "";
            const CHUNK_SIZE = 45; // characters per writing burst
            for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
              const delta = fullText.slice(i, i + CHUNK_SIZE);
              sendEvent("chunk", { delta });
              // Subtle pacing to allow the Kalam writing animation to move smoothly
              await new Promise((r) => setTimeout(r, 18));
            }

            // Update user message to completed
            if (userMessageId) {
              await supabase
                .from("messages")
                .update({ status: "completed" })
                .eq("id", userMessageId);
            }

            // Save Assistant Response
            let assistantMessageId: string | null = null;
            if (saveHistory && conversationId) {
              const { data: savedAssistantMsg } = await supabase
                .from("messages")
                .insert({
                  conversation_id: conversationId,
                  user_id: user.id,
                  role: "assistant",
                  content: fullText,
                  status: "completed",
                  sources: aiResult.sources || [],
                  response_time_ms: responseTimeMs,
                })
                .select()
                .single();

              if (savedAssistantMsg) {
                assistantMessageId = savedAssistantMsg.id;
              }
            }

            const dynamicTitle = await getDynamicTitle();

            sendEvent("done", {
              conversationId,
              conversationTitle: dynamicTitle,
              userMessageId,
              assistantMessageId,
              content: fullText,
              sources: aiResult.sources || [],
              responseTimeMs,
            });
            controller.close();
          } catch (err: any) {
            console.error("Stream error in Chat API:", err);
            if (userMessageId) {
              await supabase
                .from("messages")
                .update({
                  status: "failed",
                  error_message: err.message || "AI Provider failed to respond.",
                })
                .eq("id", userMessageId);
            }
            sendEvent("error", {
              error: err.message || "An error occurred while generating the response.",
            });
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // 7. Non-Streaming JSON Fallback
    const aiResult = await routeAiRequest(
      personaId as PersonaId,
      messagesContext,
      preferredLanguage
    );

    const responseTimeMs = Date.now() - startTime;

    if (userMessageId) {
      await supabase
        .from("messages")
        .update({ status: "completed" })
        .eq("id", userMessageId);
    }

    let assistantMessageId: string | null = null;
    if (saveHistory && conversationId) {
      const { data: savedAssistantMsg } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: "assistant",
          content: aiResult.text,
          status: "completed",
          sources: aiResult.sources || [],
          response_time_ms: responseTimeMs,
        })
        .select()
        .single();

      if (savedAssistantMsg) {
        assistantMessageId = savedAssistantMsg.id;
      }
    }

    const dynamicTitle = await getDynamicTitle();

    return NextResponse.json({
      conversationId,
      conversationTitle: dynamicTitle,
      userMessageId,
      assistantMessageId,
      content: aiResult.text,
      sources: aiResult.sources || [],
      responseTimeMs,
    });
  } catch (err: any) {
    console.error("Chat route handler error:", err);
    const rawMsg = err.message || "";
    const sanitized = /gemini|groq|llama|openai|claude|deepseek|api[ _-]?key/i.test(rawMsg)
      ? "The AI engine was unable to complete the response. Please try again."
      : rawMsg || "Failed to process chat request.";
    return NextResponse.json(
      { error: sanitized },
      { status: 500 }
    );
  }
}
