import Groq from "groq-sdk";
import { cleanEnv } from "../utils";
import { callGemini, GeminiResult } from "./gemini";
import { searchWeb, SourceItem, filterRelevantSources } from "../sources/search";

export async function callGroq(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string; imageBase64?: string; imageMime?: string }>,
  onStatusUpdate?: (status: string) => void
): Promise<GeminiResult> {
  const apiKey = cleanEnv(process.env.GROQ_API_KEY);
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  // If multimodal image is attached, route through Gemini vision model
  const hasImage = messages.some((m) => m.imageBase64 && m.imageMime);
  if (hasImage) {
    return await callGemini(systemPrompt, messages, undefined, onStatusUpdate);
  }

  const modelName = cleanEnv(process.env.GROQ_MODEL) || "openai/gpt-oss-120b";
  const groq = new Groq({ apiKey });

  const tools: any[] = [
    {
      type: "function",
      function: {
        name: "search_web",
        description:
          "Search the internet for current factual, mathematical, algorithmic, or computer science documentation. Call this only when external sources or references are genuinely needed.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
    },
  ];

  const MAX_TOOL_ROUNDS = 3;
  const allSources: SourceItem[] = [];
  const seenSourceUrls = new Set<string>();
  const executedQueries = new Set<string>();

  const conversationMessages: any[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      if (round === 0) {
        onStatusUpdate?.("Thinking...");
      } else {
        onStatusUpdate?.("Generating response...");
      }
      const isFinalRound = round === MAX_TOOL_ROUNDS - 1;

      const completion = await groq.chat.completions.create({
        messages: conversationMessages,
        model: modelName,
        tools,
        tool_choice: isFinalRound ? "none" : "auto",
        temperature: 0.6,
        max_tokens: 2048,
      });

      const choice = completion.choices?.[0];
      const message = choice?.message;

      // Check if Groq called tool(s)
      if (message?.tool_calls && message.tool_calls.length > 0 && !isFinalRound) {
        onStatusUpdate?.("Searching the web...");
        conversationMessages.push({
          role: "assistant",
          content: message.content || "",
          tool_calls: message.tool_calls,
        });

        for (const toolCall of message.tool_calls) {
          if (toolCall.function.name === "search_web") {
            let queryArg = "";
            try {
              const parsed = JSON.parse(toolCall.function.arguments || "{}");
              queryArg = (parsed.query || "").trim();
            } catch {
              queryArg = "";
            }

            const queryLower = queryArg.toLowerCase();
            let toolOutputContent = "";

            if (!queryArg) {
              toolOutputContent = JSON.stringify({
                success: false,
                message: "Empty search query provided.",
              });
            } else if (executedQueries.has(queryLower)) {
              toolOutputContent = JSON.stringify({
                status: "already_executed",
                message:
                  "This exact query was already searched in this turn. Do not repeat searches. Formulate your answer using known facts.",
              });
            } else {
              executedQueries.add(queryLower);
              const searchResult = await searchWeb(queryArg, 4);
              onStatusUpdate?.("Reading sources...");

              if (searchResult.success && searchResult.sources.length > 0) {
                for (const s of searchResult.sources) {
                  if (!seenSourceUrls.has(s.url)) {
                    seenSourceUrls.add(s.url);
                    allSources.push(s);
                  }
                }
                toolOutputContent = JSON.stringify(searchResult.sources);
              } else {
                toolOutputContent = JSON.stringify({
                  success: false,
                  message:
                    searchResult.message || "External search was unavailable or yielded no results.",
                  instruction:
                    "Answer the user directly using your available internal knowledge. Clearly state that external search was unavailable or yielded no results. Do not invent citations or URLs.",
                });
              }
            }

            conversationMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolOutputContent,
            });
          }
        }

        conversationMessages.push({
          role: "user",
          content: "Based on the search results provided above, formulate your comprehensive answer to the user now.",
        });

        continue;
      }

      // Model returned direct text content
      const directText = message?.content || "";
      if (directText.trim()) {
        const userQuery = messages.filter((m) => m.role === "user").pop()?.content || "";
        const finalSources = filterRelevantSources(allSources, userQuery, directText);
        return {
          text: directText,
          sources: finalSources,
        };
      }
    }

    // If loop finished without returning text, force a final text completion
    const finalCompletion = await groq.chat.completions.create({
      messages: [
        ...conversationMessages,
        { role: "user", content: "Provide your final synthesized response now." },
      ],
      model: modelName,
      tools,
      tool_choice: "none",
      temperature: 0.6,
      max_tokens: 2048,
    });

    const finalText = finalCompletion.choices?.[0]?.message?.content || "";
    const userQuery = messages.filter((m) => m.role === "user").pop()?.content || "";
    const finalSources = filterRelevantSources(allSources, userQuery, finalText);
    return {
      text: finalText,
      sources: finalSources,
    };
  } catch (err: any) {
    console.warn(`Groq model ${modelName} failed, falling back to Gemini:`, err.message);
    return await callGemini(systemPrompt, messages);
  }
}
