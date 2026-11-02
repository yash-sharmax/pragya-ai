import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

import { detectLanguage, routeAiRequest } from "../src/lib/ai/router";
import { filterRelevantSources, SourceItem } from "../src/lib/sources/search";
import { safeParseResponse, formatNetworkError } from "../src/lib/network";
import { PERSONAS } from "../src/lib/personas";

async function runComprehensiveTests() {
  console.log("==================================================");
  console.log("PRAGYA AI — COMPREHENSIVE STABILIZATION TEST SUITE");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${name}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
    }
  }

  // 1. Language Detection Tests
  console.log("--- 1. Dynamic Language Detection Tests ---");
  assert(
    "Detects Devanagari Hindi",
    detectLanguage("गणित के वैदिक सूत्र कैसे काम करते हैं?") === "Hindi"
  );
  assert(
    "Detects Romanized Hinglish (kaise kare)",
    detectLanguage("bhai 98 * 97 ko Vedic maths se kaise kare samjhao") === "Hinglish"
  );
  assert(
    "Detects Romanized Hinglish (batao mujhe)",
    detectLanguage("mujhe Arthashastra ke baare me batao thoda") === "Hinglish"
  );
  assert(
    "Detects English Inquiry",
    detectLanguage("Explain the difference between QuickSort and MergeSort algorithms.") === "English"
  );

  // 2. Source Relevance Filtering
  console.log("\n--- 2. Source Relevance Filter Tests ---");
  const testSources: SourceItem[] = [
    {
      title: "Narendra Modi",
      url: "https://en.wikipedia.org/wiki/Narendra_Modi",
      description: "Indian politician serving as the 14th prime minister of India.",
    },
    {
      title: "G20 New Delhi summit",
      url: "https://en.wikipedia.org/wiki/2023_G20_New_Delhi_summit",
      description: "The 2023 G20 New Delhi summit was the eighteenth meeting of G20.",
    },
    {
      title: "BMW 3 Series",
      url: "https://en.wikipedia.org/wiki/BMW_3_Series",
      description: "Compact executive car manufactured by BMW.",
    },
  ];

  const userQuery = "What was the architectural design of the Bharat Mandapam venue for the G20 New Delhi summit?";
  const modelResponse = "The Bharat Mandapam at Pragati Maidan hosted the G20 New Delhi summit, featuring architectural elements inspired by the Shankha (conch shell).";

  const filtered = filterRelevantSources(testSources, userQuery, modelResponse);

  assert(
    "Filtered out off-topic 'Narendra Modi' source",
    !filtered.some((s) => s.title.includes("Narendra Modi")),
    "Should not include politician when discussing architectural design"
  );
  assert(
    "Filtered out completely off-topic 'BMW 3 Series'",
    !filtered.some((s) => s.title.includes("BMW")),
    "Should not include cars on summit queries"
  );
  assert(
    "Retained genuine 'G20 New Delhi summit' source",
    filtered.some((s) => s.title.includes("G20")),
    "Should retain matching and discussed source"
  );

  // 3. Network and Safe Error Handling
  console.log("\n--- 3. Network & Safe Parsing Tests ---");

  // Mock 504 Gateway Timeout response
  const mockTimeoutResponse = new Response("<html><head><title>504 Gateway Time-out</title></head><body><h1>504 Gateway Time-out</h1></body></html>", {
    status: 504,
    headers: { "Content-Type": "text/html" },
  });
  const parsedTimeout = await safeParseResponse(mockTimeoutResponse);
  assert(
    "Handles 504 HTML without JSON crash",
    Boolean(!parsedTimeout.ok && parsedTimeout.error?.includes("Gateway timeout")),
    parsedTimeout.error
  );

  // Mock 502 Bad Gateway response
  const mock502Response = new Response("Bad Gateway", {
    status: 502,
    headers: { "Content-Type": "text/plain" },
  });
  const parsed502 = await safeParseResponse(mock502Response);
  assert(
    "Handles 502 Service Unavailable cleanly",
    Boolean(!parsed502.ok && parsed502.error?.includes("unavailable")),
    parsed502.error
  );

  // Mock 401 Unauthorized
  const mock401Response = new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
  const parsed401 = await safeParseResponse(mock401Response);
  assert(
    "Handles 401 Session Expired gracefully",
    Boolean(!parsed401.ok && parsed401.error?.includes("session has expired")),
    parsed401.error
  );

  // Test formatNetworkError
  assert(
    "formatNetworkError eliminates raw '<' error",
    formatNetworkError(new SyntaxError("Unexpected token '<', \"<html>...\" is not valid JSON")).includes("unexpected response")
  );

  // 4. Status Tracking Callback Test
  console.log("\n--- 4. Live Status Callback & Persona Routing Test ---");
  const recordedStatuses: string[] = [];
  const statusCallback = (status: string) => {
    recordedStatuses.push(status);
  };

  try {
    const ganitaResult = await routeAiRequest(
      "ganita",
      [
        {
          role: "user",
          content: "Calculate 15 * 15 using Ekadhikena Purvena sutra in 2 sentences.",
        },
      ],
      "en",
      statusCallback
    );

    assert(
      "Pragya Ganita responded with text",
      Boolean(ganitaResult.text && ganitaResult.text.length > 20),
      ganitaResult.text?.slice(0, 50)
    );
    assert(
      "Status callback received status transitions",
      recordedStatuses.length >= 1,
      `Recorded: ${recordedStatuses.join(" -> ")}`
    );
    assert(
      "Pragya Ganita referenced Ekadhikena Purvena or 225",
      ganitaResult.text.includes("225") || ganitaResult.text.toLowerCase().includes("ekadhikena"),
      ganitaResult.text?.slice(0, 100)
    );
  } catch (err: any) {
    console.error("Live AI test error:", err);
    assert("Live AI test ran without throwing unhandled exception", false, err.message);
  }

  // 5. Persona Configurations Check
  console.log("\n--- 5. All 4 Personas Configuration Verification ---");
  const personaIds = Object.keys(PERSONAS) as (keyof typeof PERSONAS)[];
  assert("All 4 personas defined (veda, neeti, ganita, sarathi)", personaIds.length === 4);
  for (const id of personaIds) {
    const p = PERSONAS[id];
    assert(
      `Persona ${p.name} (${p.sanskritName}) has prompt file and provider`,
      Boolean(p.promptFilename && p.provider && p.sanskritName)
    );
  }

  console.log("\n==================================================");
  console.log(`RESULTS: ${passedTests}/${totalTests} tests passed`);
  console.log("==================================================");
}

runComprehensiveTests().catch(console.error);
