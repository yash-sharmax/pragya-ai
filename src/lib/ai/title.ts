import { cleanEnv } from "../utils";

/**
 * Generates a concise 3-4 word conversation title from the first user prompt.
 */
export async function generateConversationTitle(promptText: string): Promise<string> {
  const fallback = promptText
    .replace(/[^\w\s\u0900-\u097F]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join(" ");

  const cleanFallback = fallback.length > 0 ? fallback : "New Conversation";

  const apiKey = cleanEnv(process.env.GEMINI_API_KEY);
  if (!apiKey) return cleanFallback;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // Fast 6s timeout

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Generate a concise 3 to 4 word title for a chat that starts with this message. Output ONLY the 3-4 words with no quotes, formatting, punctuation, or preamble:\n\n"${promptText.slice(0, 300)}"`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 20,
          temperature: 0.3,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rawTitle = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawTitle) {
        // Clean out quotes and line breaks
        const cleanTitle = rawTitle
          .replace(/^["'`]|["'`]$/g, "")
          .replace(/\n+/g, " ")
          .trim();
        if (cleanTitle.length > 2 && cleanTitle.length < 50) {
          return cleanTitle;
        }
      }
    }
  } catch (err) {
    console.warn("Dynamic title generation fallback:", err);
  }

  return cleanFallback;
}
