import { cleanEnv } from "../utils";

export interface SourceItem {
  title: string;
  url: string;
  publisher?: string;
  description?: string;
  snippet?: string;
}

export interface SearchResult {
  success: boolean;
  sources: SourceItem[];
  error?: "EMPTY_QUERY" | "CHALLENGE_DETECTED" | "HTTP_ERROR" | "TIMEOUT" | "NETWORK_ERROR" | "NO_RESULTS";
  message?: string;
}

/**
 * Searches the live internet for factual, historical, or scientific information.
 * Uses DuckDuckGo search with bot-challenge detection, timeouts, and Wikipedia fallback.
 */
export async function searchWeb(query: string, limit: number = 4): Promise<SearchResult> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      success: false,
      sources: [],
      error: "EMPTY_QUERY",
      message: "Search query was empty.",
    };
  }

  // 1. If external Tavily provider is configured and explicitly enabled, use it
  const searchApiKey = cleanEnv(process.env.SEARCH_API_KEY);
  if (searchApiKey && process.env.SEARCH_PROVIDER === "tavily") {
    try {
      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: searchApiKey,
          query: cleanQuery,
          search_depth: "basic",
          max_results: limit,
        }),
      });
      if (tavilyRes.ok) {
        const tavilyData = await tavilyRes.json();
        if (Array.isArray(tavilyData.results) && tavilyData.results.length > 0) {
          return {
            success: true,
            sources: tavilyData.results.map((r: any) => ({
              title: r.title || "Web Source",
              url: r.url,
              publisher: extractDomain(r.url),
              description: r.content?.slice(0, 200),
            })),
          };
        }
      }
    } catch (e) {
      console.warn("Tavily search error, falling back to direct search:", e);
    }
  }

  // 2. Direct live web search via DuckDuckGo with challenge detection and timeouts
  const ddgResult = await queryDuckDuckGo(cleanQuery, limit);
  if (ddgResult.success && ddgResult.sources.length > 0) {
    return ddgResult;
  }

  // 3. If DuckDuckGo was challenged, timed out, or returned an error, fallback to Wikipedia Open API
  if (
    !ddgResult.success &&
    (ddgResult.error === "CHALLENGE_DETECTED" ||
      ddgResult.error === "TIMEOUT" ||
      ddgResult.error === "HTTP_ERROR")
  ) {
    const wikiResult = await queryWikipedia(cleanQuery, limit);
    if (wikiResult.success && wikiResult.sources.length > 0) {
      return wikiResult;
    }
  }

  return ddgResult;
}

async function queryDuckDuckGo(query: string, limit: number): Promise<SearchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);

    // Detect HTTP 202 challenge status
    if (res.status === 202) {
      return {
        success: false,
        sources: [],
        error: "CHALLENGE_DETECTED",
        message: "DuckDuckGo returned bot-challenge response (HTTP 202).",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        sources: [],
        error: "HTTP_ERROR",
        message: `DuckDuckGo search returned HTTP ${res.status}.`,
      };
    }

    const html = await res.text();

    // Detect bot challenge, anomaly modal, or CAPTCHA HTML
    const isChallenge =
      html.includes("anomaly-modal") ||
      html.includes("challenge-form") ||
      html.includes("anomaly.js") ||
      (html.includes("robot") && html.includes("captcha"));

    if (isChallenge) {
      return {
        success: false,
        sources: [],
        error: "CHALLENGE_DETECTED",
        message: "Bot verification or challenge detected in search response.",
      };
    }

    const results: SourceItem[] = [];
    const seenUrls = new Set<string>();
    const regex =
      /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null && results.length < limit) {
      const rawUrl = match[1];
      let actualUrl = rawUrl;
      if (rawUrl.includes("uddg=")) {
        const u = rawUrl.split("uddg=")[1]?.split("&")[0];
        if (u) {
          try {
            actualUrl = decodeURIComponent(u);
          } catch {
            actualUrl = rawUrl;
          }
        }
      }

      // Skip non-http URLs or trackers
      if (!actualUrl.startsWith("http://") && !actualUrl.startsWith("https://")) {
        continue;
      }

      // Normalize URL for deduplication
      const normalizedUrl = actualUrl.split("#")[0].replace(/\/$/, "");
      if (seenUrls.has(normalizedUrl)) {
        continue;
      }
      seenUrls.add(normalizedUrl);

      const titleMatch = match[2].replace(/<[^>]+>/g, "").trim();
      const snippet = match[3].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      const domain = extractDomain(actualUrl);

      results.push({
        title: titleMatch || domain || "Online Reference",
        url: actualUrl,
        publisher: domain,
        description: snippet.slice(0, 240),
        snippet: snippet.slice(0, 240),
      });
    }

    if (results.length > 0) {
      return {
        success: true,
        sources: results,
      };
    }

    // Check for genuine no-results page
    const isGenuineNoResults =
      html.includes("no-results") ||
      html.includes("No results found") ||
      html.includes("Not Found");

    return {
      success: isGenuineNoResults,
      sources: [],
      error: "NO_RESULTS",
      message: "No relevant search results found for the given query.",
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return {
        success: false,
        sources: [],
        error: "TIMEOUT",
        message: "Search request timed out after 6 seconds.",
      };
    }
    return {
      success: false,
      sources: [],
      error: "NETWORK_ERROR",
      message: err.message || "Failed to execute search.",
    };
  }
}

async function queryWikipedia(query: string, limit: number): Promise<SearchResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&prop=info|extracts&inprop=url&exintro=1&explaintext=1&exsentences=2&format=json&gsrlimit=${limit}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PragyaAI/1.0 (Educational AI Assistant; https://pragya.ai)",
        "Accept": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        sources: [],
        error: "HTTP_ERROR",
        message: `Wikipedia search returned HTTP ${res.status}.`,
      };
    }

    const data = await res.json();
    const pages = data.query?.pages ? Object.values(data.query.pages) : [];

    const results: SourceItem[] = pages.map((page: any) => {
      const snippet = page.extract
        ? page.extract.replace(/\s+/g, " ").trim()
        : "Encyclopedic article";
      const pageUrl = page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/\s+/g, "_"))}`;
      return {
        title: page.title,
        url: pageUrl,
        publisher: "en.wikipedia.org",
        description: snippet.slice(0, 240),
        snippet: snippet.slice(0, 240),
      };
    });

    return {
      success: results.length > 0,
      sources: results,
      error: results.length === 0 ? "NO_RESULTS" : undefined,
      message: results.length === 0 ? "No Wikipedia articles matched the query." : undefined,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return {
        success: false,
        sources: [],
        error: "TIMEOUT",
        message: "Wikipedia fallback request timed out.",
      };
    }
    return {
      success: false,
      sources: [],
      error: "NETWORK_ERROR",
      message: err.message || "Wikipedia search failed.",
    };
  }
}

/**
 * Filters and validates sources to eliminate irrelevant, ungrounded, or fabricated links.
 * Verifies that the source matches the user query and is actually discussed in the model's generated response.
 */
export function filterRelevantSources(
  sources: SourceItem[],
  userQuery: string,
  modelResponse?: string
): SourceItem[] {
  if (!sources || sources.length === 0) return [];

  const stopWords = new Set([
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "up", "about", "into", "over", "after", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "what", "which",
    "who", "whom", "this", "that", "these", "those", "am", "explain", "describe",
    "tell", "me", "how", "why", "when", "where", "can", "could", "should", "would",
    "please", "latest", "recent", "status", "news", "update"
  ]);

  const tokenize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !stopWords.has(w));

  const queryTerms = tokenize(userQuery);
  const respLower = (modelResponse || "").toLowerCase();

  return sources.filter((source) => {
    // 1. Must have a valid HTTP/HTTPS URL
    if (!source.url || (!source.url.startsWith("http://") && !source.url.startsWith("https://"))) {
      return false;
    }

    const titleLower = (source.title || "").toLowerCase();
    const titleTerms = tokenize(source.title || "");
    const snippetLower = (source.snippet || source.description || "").toLowerCase();
    const combinedSource = `${titleLower} ${snippetLower}`;

    // 2. Query relevance check:
    if (queryTerms.length > 0) {
      const queryOverlap = queryTerms.filter((term) => combinedSource.includes(term));
      const titleInQuery = queryTerms.some((term) => titleTerms.includes(term));

      if (queryOverlap.length === 0 && !titleInQuery) {
        return false;
      }
    }

    // 3. Response relevance check (if response text is provided):
    if (respLower) {
      const titleInResponse =
        respLower.includes(titleLower) ||
        (titleTerms.length > 0 && titleTerms.some((term) => respLower.includes(term)));

      if (!titleInResponse) {
        return false;
      }
    }

    // 4. Filter obvious automotive/unrelated model disambiguations unless query specifically asked
    if (titleLower.includes("bmw") && !userQuery.toLowerCase().includes("bmw")) {
      return false;
    }

    return true;
  });
}

function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "Web Source";
  }
}
