/**
 * Network Utilities for Pragya AI
 * Handles offline detection, safe JSON parsing, and friendly network error messages.
 */

export function isOnline(): boolean {
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    return navigator.onLine;
  }
  return true;
}

export interface SafeResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeParseResponse<T = any>(res: Response): Promise<SafeResponse<T>> {
  const status = res.status;
  const contentType = res.headers.get("content-type") || "";

  // 1. Handle common HTTP status errors before attempting body parse
  if (status === 401) {
    return {
      ok: false,
      status,
      error: "Your session has expired or is unauthorized. Please sign in again.",
    };
  }

  if (status === 403) {
    return {
      ok: false,
      status,
      error: "You do not have permission to access this conversation.",
    };
  }

  if (status === 404) {
    return {
      ok: false,
      status,
      error: "The requested conversation or resource was not found.",
    };
  }

  if (status === 504) {
    return {
      ok: false,
      status,
      error: "Gateway timeout: The AI service took too long to complete. Please try again.",
    };
  }

  if (status === 502 || status === 503) {
    return {
      ok: false,
      status,
      error: "The AI service is temporarily unavailable. Please try again in a moment.",
    };
  }

  // 2. Safe JSON parsing with Content-Type verification
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status,
          data,
          error: data?.error || `Request failed with status HTTP ${status}`,
        };
      }
      return { ok: true, status, data };
    } catch {
      return {
        ok: false,
        status,
        error: "Failed to parse server response as JSON.",
      };
    }
  }

  // 3. Response is not JSON (e.g., HTML error page from gateway or proxy)
  try {
    const rawText = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        status,
        error: `Server error (HTTP ${status}). Please check your connection and try again.`,
      };
    }
    return {
      ok: true,
      status,
      data: rawText as unknown as T,
    };
  } catch {
    return {
      ok: false,
      status,
      error: `Network error (HTTP ${status}).`,
    };
  }
}

export function formatNetworkError(err: any): string {
  if (!isOnline()) {
    return "Network offline. Please check your internet connection and try again.";
  }
  if (err?.name === "AbortError" || err?.message?.includes("aborted")) {
    return "Request timed out. Please try again.";
  }
  if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError")) {
    return "Unable to connect to the server. Please check your network connection.";
  }
  if (err?.message?.includes("Unexpected token '<'") || err?.message?.includes("JSON.parse")) {
    return "Server returned an unexpected response. Please try again in a moment.";
  }
  const rawMsg = err?.message || "";
  if (
    /(?:gemini|groq|llama(?:\s*3(?:\.\d+)?)?|openai|anthropic|claude|deepseek|api[ _-]?key|bearer\s+[a-z0-9_-]+|(?:ai|llm|provider)\s+model)/i.test(rawMsg)
  ) {
    return "The AI engine was unable to complete the response. Please try again.";
  }
  return rawMsg || "An unexpected network error occurred.";
}
