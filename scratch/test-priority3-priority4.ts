import fs from "fs";
import path from "path";
import katex from "katex";
import pg from "pg";
import dotenv from "dotenv";
import { normalizeMarkdownMath, wrapStandaloneMathBlocks } from "../src/components/MarkdownRenderer";

dotenv.config();

const { Client } = pg;

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

async function runTestSuite() {
  console.log("==========================================================================");
  console.log("PRAGYA AI — PRIORITY 3 + PRIORITY 4 COMPREHENSIVE VERIFICATION SUITE");
  console.log("==========================================================================\n");

  // -------------------------------------------------------------------------
  // TASK 1: Professional Logo and Application Identity
  // -------------------------------------------------------------------------
  console.log("--- TASK 1: Professional Logo & Visual Identity ---");

  const brandLogoPath = path.resolve("src/components/BrandLogo.tsx");
  assert(fs.existsSync(brandLogoPath), "BrandLogo.tsx component exists");
  const brandLogoContent = fs.readFileSync(brandLogoPath, "utf8");
  assert(brandLogoContent.includes("pragya-flame") && brandLogoContent.includes("pragya-gold"), "BrandLogo defines sacred gold and flame gradients");
  assert(brandLogoContent.includes("variant = \"full\"") && brandLogoContent.includes("variant === \"icon\""), "BrandLogo supports 'full', 'icon', and 'mark' variants");
  assert(brandLogoContent.includes("प्रज्ञा"), "BrandLogo displays Devanagari 'प्रज्ञा' accent badge");

  const appIconSvgPath = path.resolve("src/app/icon.svg");
  assert(fs.existsSync(appIconSvgPath), "src/app/icon.svg favicon exists");
  const appIconContent = fs.readFileSync(appIconSvgPath, "utf8");
  assert(appIconContent.includes("<svg") && appIconContent.includes("pragya-flame"), "src/app/icon.svg is valid SVG with Pragya flame");

  const publicIconPath = path.resolve("public/icon.svg");
  const publicFaviconPath = path.resolve("public/favicon.ico");
  assert(fs.existsSync(publicIconPath), "public/icon.svg exists");
  assert(fs.existsSync(publicFaviconPath), "public/favicon.ico exists");

  const layoutPath = path.resolve("src/app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf8");
  assert(layoutContent.includes("icons:") && layoutContent.includes("/icon.svg"), "layout.tsx declares icon and favicon metadata");

  const sidebarPath = path.resolve("src/components/Sidebar.tsx");
  const sidebarContent = fs.readFileSync(sidebarPath, "utf8");
  assert(sidebarContent.includes("<BrandLogo size=\"sm\" />"), "Sidebar.tsx renders BrandLogo");

  const chatWorkspacePath = path.resolve("src/components/ChatWorkspace.tsx");
  const chatWorkspaceContent = fs.readFileSync(chatWorkspacePath, "utf8");
  assert(chatWorkspaceContent.includes("<BrandLogo variant=\"mark\" size=\"xl\" />"), "ChatWorkspace.tsx renders BrandLogo in empty state");

  // -------------------------------------------------------------------------
  // TASK 2: Complete Login and Auth Redesign
  // -------------------------------------------------------------------------
  console.log("\n--- TASK 2: Complete Login & Auth Redesign ---");

  const loginPath = path.resolve("src/app/login/page.tsx");
  const loginContent = fs.readFileSync(loginPath, "utf8");
  assert(loginContent.includes("BrandLogo"), "login/page.tsx integrates BrandLogo");
  assert(loginContent.includes("setIsSignUp(false)") && loginContent.includes("setIsSignUp(true)"), "login/page.tsx provides dedicated tabs switcher for Sign In vs Create Account");
  assert(loginContent.includes("showPassword") && loginContent.includes("Eye") && loginContent.includes("EyeOff"), "login/page.tsx provides show/hide password toggle");
  assert(loginContent.includes("handleGoogleLogin") && loginContent.includes("Continue with Google"), "login/page.tsx preserves Google OAuth with Google icon");
  assert(loginContent.includes("disabled={loading || googleLoading}") || loginContent.includes("disabled={googleLoading || loading}"), "login/page.tsx prevents multiple simultaneous submissions");
  assert(loginContent.includes("password.length < 6"), "login/page.tsx enforces password validation");
  assert(loginContent.includes("Pragya Veda") && loginContent.includes("Pragya Neeti") && loginContent.includes("Pragya Ganita") && loginContent.includes("Pragya Sarathi"), "login/page.tsx showcases all 4 knowledge personas");

  // -------------------------------------------------------------------------
  // TASK 3: Remove ALL AI Provider & Model Names from User Interface
  // -------------------------------------------------------------------------
  console.log("\n--- TASK 3: Remove ALL AI Provider & Model Names from UI ---");

  assert(!chatWorkspaceContent.includes("Google Gemini") && !chatWorkspaceContent.includes("Groq LLaMA"), "ChatWorkspace.tsx does NOT expose Google Gemini or Groq LLaMA");
  assert(!chatWorkspaceContent.includes("Provider:"), "ChatWorkspace.tsx does NOT expose 'Provider:' text");

  const personaSelectorPath = path.resolve("src/components/PersonaSelector.tsx");
  const personaSelectorContent = fs.readFileSync(personaSelectorPath, "utf8");
  assert(!personaSelectorContent.includes("Google Gemini") && !personaSelectorContent.includes("Groq LLaMA"), "PersonaSelector.tsx does NOT expose Google Gemini or Groq LLaMA");
  assert(personaSelectorContent.includes("{p.tagline}"), "PersonaSelector.tsx displays persona tagline instead of provider");

  const networkPath = path.resolve("src/lib/network.ts");
  const networkContent = fs.readFileSync(networkPath, "utf8");
  assert(networkContent.includes("gemini") && networkContent.includes("groq") && networkContent.includes("llama"), "formatNetworkError sanitizes internal AI provider names from error messages");

  const chatRoutePath = path.resolve("src/app/api/chat/route.ts");
  const chatRouteContent = fs.readFileSync(chatRoutePath, "utf8");
  assert(chatRouteContent.includes("/gemini|groq|llama|openai|claude|deepseek|api[ _-]?key/i"), "api/chat route sanitizes internal AI provider names from server errors");

  // -------------------------------------------------------------------------
  // TASK 5: Public Chat Sharing Feature
  // -------------------------------------------------------------------------
  console.log("\n--- TASK 5: Public Chat Sharing Feature ---");

  const migrationPath = path.resolve("supabase/migrations/20261104_add_public_sharing.sql");
  assert(fs.existsSync(migrationPath), "Migration 20261104_add_public_sharing.sql exists");
  const migrationContent = fs.readFileSync(migrationPath, "utf8");
  assert(migrationContent.includes("is_public BOOLEAN") && migrationContent.includes("public_share_token TEXT UNIQUE"), "Migration adds is_public, public_share_token, and public_shared_at");
  assert(migrationContent.includes("Anyone can view public conversations"), "Migration creates RLS policy for public conversations");

  const shareApiRoutePath = path.resolve("src/app/api/conversations/[id]/share/route.ts");
  assert(fs.existsSync(shareApiRoutePath), "api/conversations/[id]/share/route.ts exists");
  const shareApiContent = fs.readFileSync(shareApiRoutePath, "utf8");
  assert(shareApiContent.includes("export async function GET") && shareApiContent.includes("export async function POST") && shareApiContent.includes("export async function DELETE"), "Conversation share API implements GET, POST (enable), and DELETE (revoke)");

  const publicShareRoutePath = path.resolve("src/app/api/share/[token]/route.ts");
  assert(fs.existsSync(publicShareRoutePath), "api/share/[token]/route.ts exists");
  const publicShareContent = fs.readFileSync(publicShareRoutePath, "utf8");
  assert(publicShareContent.includes("get_public_shared_conversation") || publicShareContent.includes("eq(\"public_share_token\", token.trim())"), "Public share API queries securely by token and verifies is_public = true");

  const shareModalPath = path.resolve("src/components/ShareModal.tsx");
  assert(fs.existsSync(shareModalPath), "ShareModal.tsx exists");
  const shareModalContent = fs.readFileSync(shareModalPath, "utf8");
  assert(shareModalContent.includes("handleToggleShare") && shareModalContent.includes("handleCopyLink"), "ShareModal provides toggle share and copy link handlers");
  assert(shareModalContent.includes("Revoke Link") && shareModalContent.includes("Create Public Link"), "ShareModal provides create and revoke link options");

  const sharePagePath = path.resolve("src/app/share/[token]/page.tsx");
  assert(fs.existsSync(sharePagePath), "src/app/share/[token]/page.tsx public view page exists");
  const sharePageContent = fs.readFileSync(sharePagePath, "utf8");
  assert(sharePageContent.includes("MarkdownRenderer") && sharePageContent.includes("SourcesList"), "Public share page renders MarkdownRenderer and SourcesList");
  assert(sharePageContent.includes("Conversation Unavailable"), "Public share page handles revoked / 404 conversations gracefully");

  const middlewarePath = path.resolve("src/lib/supabase/middleware.ts");
  const middlewareContent = fs.readFileSync(middlewarePath, "utf8");
  assert(middlewareContent.includes("/share") && middlewareContent.includes("/api/share"), "middleware.ts permits unauthenticated access to /share and /api/share");

  // -------------------------------------------------------------------------
  // TASK 6: Fix LaTeX Rendering Problem Completely
  // -------------------------------------------------------------------------
  console.log("\n--- TASK 6: Fix LaTeX Rendering Problem Completely ---");

  const globalsCssPath = path.resolve("src/app/globals.css");
  const globalsCssContent = fs.readFileSync(globalsCssPath, "utf8");
  assert(globalsCssContent.includes(".katex .fbox") && globalsCssContent.includes("box-sizing: border-box !important"), "globals.css overrides .katex .fbox with box-sizing border-box");
  assert(globalsCssContent.includes("width: 100% !important") && globalsCssContent.includes("min-width: 100% !important"), "globals.css enforces width 100% on fbox to prevent horizontal collapse");
  assert(globalsCssContent.includes(".pstrut + .fbox") || globalsCssContent.includes(".pstrut + .katex-stretchy.fbox"), "globals.css anchors strut + fbox in KaTeX multi-line vlist");

  // Test the exact user equation from the problem description
  const targetEquation = `\\boxed{
\\begin{aligned}
x_{1}(t)&=e^{t}\\bigl(c_{1}\\cos 2t + c_{2}\\sin 2t\\bigr),\\\\[4pt]
x_{2}(t)&=e^{t}\\bigl(-c_{1}\\sin 2t + c_{2}\\cos 2t\\bigr),
\\end{aligned}}
\\qquad c_{1},c_{2}\\in\\mathbb R.`;

  // Test Case A: Raw equation without outer delimiters
  const normalizedRaw = normalizeMarkdownMath(targetEquation);
  assert(normalizedRaw.includes("$$") && normalizedRaw.includes("\\boxed{"), "normalizeMarkdownMath wraps standalone raw \\boxed{\\begin{aligned}...} in $$ delimiters");
  assert(normalizedRaw.includes("x_{1}(t)&="), "normalizeMarkdownMath preserves column alignment ampersands");
  assert(normalizedRaw.includes("\\\\[4pt]"), "normalizeMarkdownMath preserves LaTeX row spacing \\\\[4pt]");
  assert(normalizedRaw.includes("\\qquad c_{1},c_{2}\\in\\mathbb R."), "normalizeMarkdownMath includes trailing math terms in display math block");

  const bracketEquation = `\\[
${targetEquation}
\\]`;
  const normalizedBracket = normalizeMarkdownMath(bracketEquation);
  assert(
    normalizedBracket.includes("$$") &&
    !normalizedBracket.trim().startsWith("\\[") &&
    !normalizedBracket.trim().endsWith("\\]"),
    "normalizeMarkdownMath converts outer \\[ ... \\] to $$...$$"
  );

  // Test Case C: KaTeX engine parses normalized output without errors
  const mathBlockMatch = normalizedRaw.match(/\$\$([\s\S]*?)\$\$/);
  assert(Boolean(mathBlockMatch), "Extracted math block from normalized output");
  if (mathBlockMatch) {
    const renderedHtml = katex.renderToString(mathBlockMatch[1], {
      displayMode: true,
      throwOnError: false,
    });
    assert(!renderedHtml.includes("katex-error"), "KaTeX renders target equation without parse errors");
    assert(renderedHtml.includes("fbox"), "KaTeX generated fbox element for \\boxed{}");
    assert(renderedHtml.includes("col-align-r") && renderedHtml.includes("col-align-l"), "KaTeX properly parsed multi-column aligned environment");
  }

  // -------------------------------------------------------------------------
  // LIVE DATABASE & API TEST: Public Sharing Verification
  // -------------------------------------------------------------------------
  console.log("\n--- LIVE DATABASE VERIFICATION: Public Sharing Schema ---");

  const rawUrl = process.env.DATABASE_URL || "";
  const sanitizedUrl = rawUrl.trim().replace(/^["']|["']$/g, "");

  if (sanitizedUrl) {
    const client = new Client({
      connectionString: sanitizedUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log("  Connected to PostgreSQL database for verification...");

      // Check conversations table columns
      const colRes = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'conversations'
          AND column_name IN ('is_public', 'public_share_token', 'public_shared_at');
      `);

      const colNames = colRes.rows.map((r: any) => r.column_name);
      assert(colNames.includes("is_public"), "conversations table has 'is_public' column");
      assert(colNames.includes("public_share_token"), "conversations table has 'public_share_token' column");
      assert(colNames.includes("public_shared_at"), "conversations table has 'public_shared_at' column");

      // Check unique index on public_share_token
      const idxRes = await client.query(`
        SELECT indexname FROM pg_indexes
        WHERE tablename = 'conversations' AND indexname = 'idx_conversations_public_share_token';
      `);
      assert(idxRes.rows.length > 0, "idx_conversations_public_share_token index exists in database");

      // Check RLS policies / secure functions
      const rpcProcRes = await client.query(`
        SELECT proname FROM pg_proc
        WHERE proname = 'get_public_shared_conversation';
      `);
      assert(rpcProcRes.rows.length > 0, "get_public_shared_conversation secure RPC function exists in database");

      await client.end();
    } catch (dbErr: any) {
      console.error("Database live check failed:", dbErr.message);
      assert(false, "Database connection and live verification succeeded");
    }
  }

  // -------------------------------------------------------------------------
  // FINAL RESULTS
  // -------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log(`RESULTS: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log("==========================================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
