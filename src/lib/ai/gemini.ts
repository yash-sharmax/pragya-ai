import { cleanEnv } from "../utils";
import { searchWeb, SourceItem, filterRelevantSources } from "../sources/search";

export interface GeminiResult {
  text: string;
  sources: SourceItem[];
}

export async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string; imageBase64?: string; imageMime?: string }>,
  modelNameOverride?: string,
  onStatusUpdate?: (status: string) => void
): Promise<GeminiResult> {
  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const configuredModel = cleanEnv(process.env.GEMINI_MODEL);
  const modelsToTry = [
    modelNameOverride,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    configuredModel,
    "gemini-flash-latest",
  ].filter(Boolean) as string[];

  // Convert input messages to Gemini parts format
  const formattedContents: any[] = [];
  for (const msg of messages) {
    const parts: any[] = [];

    if (msg.imageBase64 && msg.imageMime) {
      parts.push({
        inlineData: {
          mimeType: msg.imageMime,
          data: msg.imageBase64,
        },
      });
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    formattedContents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    });
  }

  const searchToolDefinition = {
    functionDeclarations: [
      {
        name: "search_web",
        description:
          "Search the internet for current factual, historical, scientific, or literature information. Only call when external sources or references are genuinely needed.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Search query" },
          },
          required: ["query"],
        },
      },
    ],
  };

  const MAX_TOOL_ROUNDS = 3;
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const allSources: SourceItem[] = [];
      const seenSourceUrls = new Set<string>();
      const executedQueries = new Set<string>();
      let currentContents = [...formattedContents];

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        if (round === 0) {
          onStatusUpdate?.("Thinking...");
        } else {
          onStatusUpdate?.("Generating response...");
        }
        const isFinalRound = round === MAX_TOOL_ROUNDS - 1;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 18000);

        const payload: any = {
          contents: currentContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          // Do not send tools on the final round to force text generation
          tools: isFinalRound ? undefined : [searchToolDefinition],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const errMsg = errJson.error?.message || `HTTP ${res.status}`;
          console.warn(`Gemini model ${model} round ${round} failed: ${errMsg}`);
          lastError = new Error(`Gemini error: ${errMsg}`);
          break; // Move to next model candidate
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        if (!candidate) continue;

        // Check for Google Search Grounding metadata if available
        if (candidate.groundingMetadata?.groundingChunks) {
          for (const chunk of candidate.groundingMetadata.groundingChunks) {
            if (chunk.web?.uri && !seenSourceUrls.has(chunk.web.uri)) {
              seenSourceUrls.add(chunk.web.uri);
              allSources.push({
                title: chunk.web.title || "Web Reference",
                url: chunk.web.uri,
                publisher: extractDomain(chunk.web.uri),
              });
            }
          }
        }

        const parts = candidate.content?.parts || [];
        const functionCallPart = parts.find(
          (p: any) => p.functionCall && p.functionCall.name === "search_web"
        );

        // If no function call was made or on final round: check for text response
        if (!functionCallPart || isFinalRound) {
          const directText = parts
            .map((p: any) => p.text)
            .filter(Boolean)
            .join("\n");
          if (directText.trim()) {
            const userQuery = messages.filter((m) => m.role === "user").pop()?.content || "";
            const finalSources = filterRelevantSources(allSources, userQuery, directText);
            return {
              text: directText,
              sources: finalSources,
            };
          }
        }

        // Model requested search_web within round limits
        if (functionCallPart && !isFinalRound) {
          onStatusUpdate?.("Searching the web...");
          const rawQuery = (functionCallPart.functionCall.args?.query || "").trim();
          const queryLower = rawQuery.toLowerCase();

          // Append model turn preserving thoughtSignature and id
          currentContents.push({
            role: "model",
            parts: [functionCallPart],
          });

          let toolOutputText = "";

          if (executedQueries.has(queryLower)) {
            toolOutputText =
              "Search status: This exact query was already executed in this session. Do not repeat search queries. Synthesize your final answer using existing information.";
          } else {
            executedQueries.add(queryLower);
            const searchResult = await searchWeb(rawQuery, 4);
            onStatusUpdate?.("Reading sources...");

            if (searchResult.success && searchResult.sources.length > 0) {
              for (const s of searchResult.sources) {
                if (!seenSourceUrls.has(s.url)) {
                  seenSourceUrls.add(s.url);
                  allSources.push(s);
                }
              }
              toolOutputText = searchResult.sources
                .map(
                  (r) =>
                    `Title: ${r.title}\nURL: ${r.url}\nPublisher: ${r.publisher || ""}\nSnippet: ${
                      r.description || r.snippet || ""
                    }`
                )
                .join("\n\n");
            } else {
              toolOutputText = `Search status: ${
                searchResult.message || "External search was unavailable or yielded no results."
              }\nInstruction: Answer the user's question directly based on your internal knowledge. Clearly indicate uncertainty if current facts cannot be verified. Do not invent fake citations or URLs.`;
            }
          }

          // Append function response turn and instruction turn
          currentContents.push({
            role: "user",
            parts: [
              {
                functionResponse: {
                  name: "search_web",
                  response: { output: toolOutputText },
                },
              },
            ],
          });

          currentContents.push({
            role: "user",
            parts: [
              {
                text: "Based on the search results provided above, formulate your comprehensive answer to the user now.",
              },
            ],
          });
        }
      }

      // If loop exited without text, make one final forced completion call without tools
      const finalRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...currentContents,
            { role: "user", parts: [{ text: "Provide your final synthesized response now." }] },
          ],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      if (finalRes.ok) {
        const finalData = await finalRes.json();
        const parts = finalData.candidates?.[0]?.content?.parts || [];
        const finalText = parts
          .map((p: any) => p.text)
          .filter(Boolean)
          .join("\n");
        if (finalText.trim()) {
          const userQuery = messages.filter((m) => m.role === "user").pop()?.content || "";
          const finalSources = filterRelevantSources(allSources, userQuery, finalText);
          return { text: finalText, sources: finalSources };
        }
      }
    } catch (err: any) {
      console.warn(`Gemini model ${model} call error:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response from Gemini.");
}

function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, "");
  } catch {
    return "Web Source";
  }
}
