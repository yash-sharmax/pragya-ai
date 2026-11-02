import { PersonaId, PERSONAS } from "../personas";
import { getPersonaPrompt } from "../personas-server";
import { callGemini, GeminiResult } from "./gemini";
import { callGroq } from "./groq";

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  imageMime?: string;
}

export function detectLanguage(text: string): "Hindi" | "Hinglish" | "English" {
  if (!text) return "English";

  // Check for Devanagari characters
  if (/[\u0900-\u097F]/.test(text)) {
    return "Hindi";
  }

  // Check for common Romanized Hindi / Hinglish tokens
  const hinglishPatterns = [
    /\b(kaise|kare|karo|karna|karke|kariye|samjhao|batao|bataiye|dikhao)\b/i,
    /\b(hai|hain|nahi|nhi|mujhe|mera|meri|mere|kya|kyun|kyu|hoga|hogi|hoge)\b/i,
    /\b(thoda|thodi|achha|accha|matlab|namaste|shukriya|dhanyawad|dhanyavad)\b/i,
    /\b(bhai|dost|aap|tum|hum|ye|yeh|woh|wo|aur|bhi|toh|to|lekin|par)\b/i,
    /\b(kijiye|sikhao|btao|smjhao|krna|krte|hota|hoti)\b/i,
  ];

  const matchCount = hinglishPatterns.filter((pattern) => pattern.test(text)).length;
  if (matchCount >= 1) {
    return "Hinglish";
  }

  return "English";
}

export async function routeAiRequest(
  personaId: PersonaId,
  messages: ChatMessageInput[],
  languagePreference?: string,
  onStatusUpdate?: (status: string) => void
): Promise<GeminiResult> {
  const persona = PERSONAS[personaId] || PERSONAS.veda;
  let basePrompt = getPersonaPrompt(personaId);

  // Dynamic language detection from the user's latest inquiry
  const latestUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
  const detectedLanguage = detectLanguage(latestUserMsg);

  let languageDirective = "";
  if (detectedLanguage === "Hindi") {
    languageDirective =
      "CRITICAL: The user has written in Hindi. You MUST respond completely in Hindi using Devanagari script for all prose and standard LaTeX for mathematics/code.\nFEMININE SELF-REFERENCE: When referring to yourself in Hindi, always use feminine verb forms (e.g., 'मैं समझा सकती हूँ', 'मैं देख रही हूँ', 'मैं आपको बताती हूँ'). Address the user with respectful neutral terms ('आप').";
  } else if (detectedLanguage === "Hinglish") {
    languageDirective =
      "CRITICAL: The user has written in Hinglish (Hindi words written in Latin/English script, e.g., 'kaise kare', 'samjhao', 'batao'). You MUST respond in fluent, natural Hinglish throughout your ENTIRE explanation. Do NOT switch to pure English mid-response. Explain intuition, steps, and thoughts conversationally in Hinglish while maintaining standard notation for code and mathematical formulas.\nFEMININE SELF-REFERENCE: When referring to yourself in Hinglish, always use feminine verb forms (e.g., 'Main samjha sakti hoon', 'Main dekh rahi hoon', 'Main aapko batati hoon'). Address the user respectfully as 'aap'.";
  } else if (languagePreference === "hi") {
    languageDirective =
      "User settings preferred language is Hindi. Respond in Hindi using authentic Devanagari script.\nFEMININE SELF-REFERENCE: Always use feminine verb forms for self-reference ('मैं समझा सकती हूँ', 'मैं देख रही हूँ').";
  } else {
    languageDirective =
      "Respond clearly in English, adhering to standard grammar and professional clarity.";
  }

  basePrompt += `\n\n## Strict Language & Self-Reference Instruction:\n${languageDirective}\nPreserve any original Sanskrit verses in authentic Devanagari script with word-by-word or fluid translations.`;

  if (persona.provider === "groq") {
    return await callGroq(basePrompt, messages, onStatusUpdate);
  } else {
    return await callGemini(basePrompt, messages, undefined, onStatusUpdate);
  }
}
