# PRAGYA AI — COMPLETE CODEBASE AUDIT & SECURITY REVIEW REPORT

**Audit Date:** November 2, 2026  
**Auditor:** Senior Full-Stack Security & AI Architecture Auditor  
**Project Root:** `/home/dilip/Desktop/Yash's Projects/Pragya AI`  
**Target Priorities:** Priority 1 (Chat Stability), Priority 2 (Ancient Experience & Core AI), Priority 3 (Branding, Auth & Privacy), Priority 4 (Public Sharing & Advanced LaTeX)  

---

## 1. EXECUTIVE SUMMARY

### 1.1 Overall Health Assessment
Pragya AI has achieved a substantial architectural transformation. The core chat experience demonstrates solid fundamentals:
- **Chat Stability & Navigation:** Active race conditions during chat switching and the welcome-screen snap-back have been resolved via ref-based locks (`activeConversationIdRef`), in-flight abort mechanisms, and unified `popstate` browser history tracking.
- **Ancient Indian Knowledge & Visual Experience:** The archival parchment styling (`manuscript-surface`), traditional *Kalam* reed pen streaming indicator, and the dynamic `ThinkingIndicator` provide a distinctive aesthetic and clear feedback during search and document ingestion.
- **Persona Routing & Epistemic Boundaries:** All four personas (*Pragya Veda*, *Pragya Neeti*, *Pragya Ganita*, *Pragya Sarathi*) enforce strict epistemic guidelines, feminine self-reference in Hindi/Hinglish, Vedic mathematics prioritization, and non-negotiable mental health crisis escalation protocols.
- **Provider De-Branding:** UI components and network error sanitizers successfully mask underlying AI models (Gemini, Groq/LLaMA) to maintain product identity.

### 1.2 Public Chat Sharing Release Verdict
**VERDICT: NOT READY FOR PRODUCTION DEPLOYMENT (DO NOT RELEASE).**  
While the public sharing UI, Next.js routing, and copy-link workflows function smoothly on the surface, the underlying database Row-Level Security (RLS) policies and chat API introduce **CRITICAL** security vulnerabilities that allow unauthenticated external enumeration of private user records, conversation scraping, and cross-account message tampering.

### 1.3 Summary of Serious Issues Discovered
1. **[CRITICAL] SEC-01 — Unrestricted PostgREST Anonymous Enumeration of Public Conversations & Messages:**  
   The RLS policy defined in `supabase/migrations/20261104_add_public_sharing.sql` grants public `SELECT` access to `conversations` using `USING (is_public = true AND public_share_token IS NOT NULL)`. Any unauthenticated user with the public anonymous Supabase key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) can query `GET /rest/v1/conversations?select=*` to dump all shared conversations, user UUIDs, titles, and secret share tokens without knowing the token beforehand.
2. **[HIGH] SEC-02 — Cross-User Conversation Message Injection & Data Tampering:**  
   In `src/app/api/chat/route.ts#L76-L107`, the route fails to verify that the requesting user owns the `conversationId` provided in the payload before inserting messages. Combined with a permissive RLS policy on `messages` (`auth.uid() = user_id`), any authenticated user can inject arbitrary messages into another user's conversation ID, which will then appear on public shared links and in historical archives.
3. **[HIGH] LATEX-01 — Inline Math Double-Wrapping Corruption:**  
   In `src/components/MarkdownRenderer.tsx#L123-L130`, the preprocessing utility `wrapStandaloneMathBlocks` does not mask single-dollar inline math expressions (`$...$`). Any inline expression containing `\boxed{...}` (e.g., `The solution is $\boxed{x}$.`) is erroneously converted into broken display math blocks (`The solution is $\n$$\n\boxed{x}\n$$\n$.`), producing rendering artifacts and unparsed LaTeX.
4. **[MEDIUM] SEC-03 — User Auth UUID Leakage in Public Share Payload:**  
   In `src/app/api/share/[token]/route.ts#L58`, the unauthenticated sharing endpoint selects and returns `file_path` for message attachments, exposing the conversation owner's internal Supabase Auth UUID (`${user.id}/...`) to unauthenticated web crawlers.
5. **[LOW] MIG-01 — Future-Dated Database Migration Timestamp:**  
   The migration `supabase/migrations/20261104_add_public_sharing.sql` is stamped November 4, 2026, while the project current date is November 2, 2026. In automated CI/CD migration runners, future timestamps cause ordering defects and unpredictable rollback behavior.

---

## 2. AUDIT SCOPE & METHODOLOGY

### 2.1 Codebase Scope
The audit examined all code, configurations, database migrations, and assets implemented across Priorities 1 through 4:
- **Core Chat & Dashboard:** `src/components/ChatDashboard.tsx`, `src/components/ChatWorkspace.tsx`, `src/components/Sidebar.tsx`, `src/components/MessageBubble.tsx`, `src/components/ThinkingIndicator.tsx`.
- **Markdown & Math Rendering:** `src/components/MarkdownRenderer.tsx`, `src/app/globals.css`.
- **Public Chat Sharing:** `src/app/api/conversations/[id]/share/route.ts`, `src/app/api/share/[token]/route.ts`, `src/app/share/[token]/page.tsx`, `src/components/ShareModal.tsx`, `src/lib/supabase/middleware.ts`.
- **Document Attachments & Storage:** `src/app/api/upload/route.ts`, `src/app/api/upload/view/route.ts`, `src/lib/documents/extract.ts`.
- **Authentication & UI Branding:** `src/app/login/page.tsx`, `src/components/BrandLogo.tsx`, `src/components/PersonaSelector.tsx`.
- **AI Core & Network Layer:** `src/app/api/chat/route.ts`, `src/lib/network.ts`, `src/lib/personas/router.ts`, persona prompts (`pragya-veda-prompt.txt`, `pragya-niti-prompt.txt`, `pragya-ganit-prompt.txt`, `pragya-sarathi-prompt.txt`).
- **Database Migrations:** `supabase/migrations/20261101_init_schema.sql`, `supabase/migrations/20261102_add_sources_and_response_time.sql`, `supabase/migrations/20261103_add_title_customized.sql`, `supabase/migrations/20261104_add_public_sharing.sql`.

### 2.2 Methodology & Testing Techniques
- **Static AST & Source Inspection:** Audited control flow, asynchronous state transitions, regex safety, MIME type boundaries, and authorization checks.
- **Direct Database & PostgREST Auditing:** Issued anonymous and authenticated PostgREST queries against the local Supabase endpoint (`http://127.0.0.1:54321/rest/v1/`) to evaluate RLS policy isolation, row enumeration risks, and query constraints.
- **KaTeX DOM & Rendering Validation:** Tested all 7 target mathematical expressions using isolated Node.js test beds and `katex.renderToString` with the project's exact CSS overrides.
- **Automated Test Execution:** Executed all existing scratch test suites (`test-priority1-chat-stability.ts`, `test-priority2-ancient-experience.ts`, `test-priority3-priority4.ts`, `test-full-stabilization.ts`) and verified TypeScript compilation via `npx tsc --noEmit`.

### 2.3 Unverified Checks & Limitations
The following checks could not be fully executed in this non-interactive environment:
- **Interactive Google OAuth Web Consent Flow:** Requires live user interaction in an external web browser to complete Google's identity grant.
- **Production CDN & Edge Caching:** Local testing environment runs a standalone Next.js Node server without an external reverse proxy (Cloudflare/Fastly).
- **Extreme Concurrency Stress Testing:** Load testing was capped at standard developer limits; high-load (>1,000 concurrent streaming connections) load testing was not performed.

---

## 3. PRIORITY-WISE AUDIT FINDINGS

### 3.1 Priority 1 — Core Chat Stability
| Requirement / Feature | Status | File & Line | Evidence & Observations |
| :--- | :--- | :--- | :--- |
| **New Chat State Reset** | **Verified working** | `src/components/ChatDashboard.tsx#L274-L295` | `handleNewChat` aborts active SSE stream via `abortControllerRef.current.abort()`, resets `activeConversationIdRef.current = null`, clears `messages` state to `[]`, resets `conversationLoading`, and updates browser URL to `/` via `window.history.pushState`. Subsequent messages correctly send `conversationId: null`. |
| **Chat Switching Snap-Back Elimination** | **Verified working** | `src/components/ChatDashboard.tsx#L182-L215` | Removed obsolete `useEffect([initialConversationId])` snap-back trigger. Switched to `activeConversationIdRef` lock; slow asynchronous responses from previously clicked chats are discarded if their ID does not match the current ref. `popstate` listener registered at lines 217–232 handles back/forward history navigation cleanly. |
| **Delete Active & Inactive Chat** | **Verified working** | `src/components/Sidebar.tsx#L201-L224`<br>`src/app/api/conversations/[id]/route.ts#L48-L98` | Sidebar items use `div role="button"` to avoid invalid nested `<a>` hydration errors. Delete triggers `e.stopPropagation()` and `e.preventDefault()`. Server-side DELETE handler validates user ownership (`.eq("id", id).eq("user_id", user.id)`), purges attachments from `user-uploads` bucket, cascades messages deletion, and resets active view if the deleted chat was open. |
| **Refresh & Conversation Restoration** | **Verified working** | `src/app/api/conversations/[id]/route.ts#L36`<br>`src/components/ChatDashboard.tsx#L96-L103` | Messages are fetched strictly sorted by `created_at ASC`. `conversationLoading` is initialized to `true` when `initialConversationId` is present, rendering a structured skeleton loader in `ChatWorkspace.tsx#L137-L151` and preventing empty welcome screen flashes. Resets to `/` if 404 or unauthorized. |
| **Retry & Message Preservation** | **Verified working** | `src/components/ChatDashboard.tsx#L380-L460`<br>`src/app/api/chat/route.ts#L88-L102` | Offline network errors preserve both user message and failed assistant placeholder. Retry handler targets the exact prior user message, passes `isRetry: true` and `assistantMsgIdToUpdate`. The server updates the existing message rather than inserting duplicate records, and excludes the retried message from history to prevent duplicate AI context. |
| **User vs Assistant Message Bubble Alignment** | **Verified working** | `src/components/MessageBubble.tsx#L180-L245` | User container strictly applies `justify-end items-end` with `max-w-[85%] sm:max-w-[75%]`, `text-left whitespace-pre-wrap`, and `rounded-tr-none`. Assistant container applies `justify-start items-start flex-1 max-w-full overflow-hidden`, `manuscript-surface`, and `min-w-0` to eliminate horizontal scroll bleed. |

---

### 3.2 Priority 2 — Ancient Experience & Core AI Enhancement
| Requirement / Feature | Status | File & Line | Evidence & Observations |
| :--- | :--- | :--- | :--- |
| **Ancient Manuscript UI Styling** | **Verified working** | `src/app/globals.css#L107-L158` | Custom CSS utility `.manuscript-surface` applies warm aged parchment background (`#faf5eb` to `#f4ede0`), gold-dusted borders, and subtle archival drop-shadow. Dark mode variant `.dark .manuscript-surface` renders deep nocturnal folio tones (`#17120d` to `#120e0a`) without bright eye strain. |
| **Kalam Pen Writing Animation** | **Verified working** | `src/components/MessageBubble.tsx#L236-L240`<br>`src/app/globals.css#L160-L177` | `@keyframes kalam-write` animates a custom SVG reed pen (`TraditionalKalamIcon`) that renders while `isStreaming` is active. Halts immediately upon cancel, error, or completion. *(Note: Rendered as a block sibling at bottom of bubble rather than an inline cursor).* |
| **Truthful Thinking & Activity Indicator** | **Verified working** | `src/components/ThinkingIndicator.tsx#L40-L125` | Transitions dynamically across truthful status stages: `searching` (Search icon), `reading` (BookOpen icon), `thinking` (Brain icon), and `generating` (Sparkles icon). Includes live elapsed timer (`0.1s` increments) and warm gold ink shimmer pulse. |
| **Markdown, KaTeX & Copy-Paste** | **Verified working** | `src/components/MarkdownRenderer.tsx#L162-L248` | Custom `DisplayMathBlock` provides "Copy LaTeX" button; `CodeBlock` provides "Copy Code" button with visual checkmark feedback. Standard bracket delimiters `\[ ... \]` and `\( ... \)` normalized cleanly. |
| **PDF & Document Text Extraction** | **Verified working** | `src/lib/documents/extract.ts#L15-L93`<br>`src/app/api/upload/route.ts#L17-L100` | Supports PDF (`pdf-parse`), DOCX (`mammoth`), and TXT. Enforces 10MB limit. Scanned PDFs with `< 20` characters return a clean explanatory notice rather than crashing. Extracted text is injected into prompt context. |
| **Dark Mode Sources Readability** | **Verified working** | `src/components/SourcesList.tsx#L55-L100` | High-contrast styling with `dark:text-amber-100`, `dark:bg-[#1c1510]`, and `dark:border-amber-800/40`. Source snippets are permanently visible (not hover-only) and wrap safely with `break-words`. |
| **Ganita: Vedic Mathematics First** | **Verified working** | `pragya-ganit-prompt.txt#L22-L48`<br>`src/lib/personas/router.ts#L70-L105` | Mandates Vedic Mathematics First protocol (Nikhilam, Urdhva-Tiryagbhyam, Ekadhikena Purvena, Paravartya Yojayet). Requires explicit modern math fallback statement when no sutra applies. Forbids hallucinated sutras. Live test confirmed 98 * 97 solved via Nikhilam Sutra. |
| **Persona Prompts & Crisis Boundaries** | **Verified working** | `pragya-sarathi-prompt.txt#L49-L63`<br>`src/lib/personas/router.ts#L112-L138` | All 4 personas enforce feminine grammatical self-reference in Hindi/Hinglish ("Main samjha sakti hoon"). Pragya Sarathi includes non-negotiable crisis safety protocols with Tele-MANAS (14416), KIRAN (1800-599-0019), and 988 helplines. |

---

### 3.3 Priority 3 — Branding, Auth Redesign & Provider Privacy
| Requirement / Feature | Status | File & Line | Evidence & Observations |
| :--- | :--- | :--- | :--- |
| **Brand Identity & Favicons** | **Verified working** | `src/components/BrandLogo.tsx#L1-L125`<br>`src/app/layout.tsx#L24-L35` | Custom SVG flame and sacred geometry lotus motif with gold/saffron gradients. Devanagari accent badge `प्रज्ञा`. Includes full, icon, and mark variants. `icon.svg` and `favicon.ico` properly declared in root metadata. |
| **Login & Auth Redesign** | **Verified working** | `src/app/login/page.tsx#L1-L280` | Two-column split layout: Left side showcases all 4 knowledge personas with rich typography; Right side provides tabbed card switching between "Sign In" and "Create Account". Password visibility toggle, live validation, and Google OAuth preservation. |
| **Provider & Model De-Branding** | **Verified working** | `src/components/ChatWorkspace.tsx#L200-L240`<br>`src/components/PersonaSelector.tsx#L40-L90`<br>`src/lib/network.ts#L115-L140` | All user-facing UI elements scrubbed of internal provider names ("Google Gemini", "Groq", "LLaMA 3.3"). Persona taglines emphasize domains of wisdom. Global error sanitizers intercept provider leaks. |
| **Overly Broad Error Sanitization** | **Potential risk** | `src/lib/network.ts#L126` | Regex `/\b(?:gemini|groq|llama|openai|anthropic|claude|deepseek|model)\b/gi` matches the plain English noun `model`. An error such as "Database data model validation failed" will be masked as "the system". |

---

### 3.4 Priority 4 — Public Chat Sharing & Advanced LaTeX
| Requirement / Feature | Status | File & Line | Evidence & Observations |
| :--- | :--- | :--- | :--- |
| **Public Sharing Migration** | **Verified issue** | `supabase/migrations/20261104_add_public_sharing.sql#L1-L38` | Adds `is_public`, `public_share_token`, `public_shared_at` columns and unique index. However, the migration file is future-dated (`20261104`) and creates a critically vulnerable public `SELECT` RLS policy allowing unauthenticated table enumeration. |
| **Conversation Share API (Owner)** | **Verified working** | `src/app/api/conversations/[id]/share/route.ts#L1-L150` | Authenticated GET returns share status. POST generates 64-char cryptographically secure token (`crypto.randomBytes(32).toString('hex')`) and sets `is_public = true`. DELETE revokes the share link. Ownership strictly enforced via `.eq("id", id).eq("user_id", user.id)`. |
| **Public Conversation Read API** | **Verified issue** | `src/app/api/share/[token]/route.ts#L25-L71` | Public unauthenticated route fetches shared conversation, completed messages, and attachments. While query filters by `token` and `is_public = true`, line 58 selects `file_path` on attachments, leaking the owner's Supabase Auth UUID. |
| **Share Modal UI & Management** | **Verified working** | `src/components/ShareModal.tsx#L1-L185` | Clean dialog with toggle switch to publish/unpublish, dynamic link generation (`/share/[token]`), one-click clipboard copy, and revoke link button with confirmation state. |
| **Public Share Viewer Page** | **Verified working** | `src/app/share/[token]/page.tsx#L1-L290` | Public read-only page with custom header, conversation title, persona banner, message stream, attachment pills, LaTeX math rendering, and verified sources. Properly returns 404/revoked state for invalid tokens. |
| **Middleware Public Whitelist** | **Verified working** | `src/lib/supabase/middleware.ts#L25-L35` | Route matchers permit unauthenticated public access to `/share/*` and `/api/share/*` without forcing redirects to `/login`. |
| **KaTeX `.fbox` Horizontal Collapse Fix** | **Verified working** | `src/app/globals.css#L180-L215` | Overrides `.katex .fbox` with `box-sizing: border-box`, `width: 100%`, and anchors strut containers in KaTeX `vlist` tables to prevent multi-line boxes from collapsing to single-line height or clipping right borders. |
| **Inline Math Double-Wrapping Bug** | **Verified issue** | `src/components/MarkdownRenderer.tsx#L123-L130` | `wrapStandaloneMathBlocks` fails to mask single-dollar inline math expressions. Formulas such as `$\boxed{x}$` inside sentences are erroneously split into multiline display math blocks, breaking paragraph layout. |

---

## 4. DETAILED SECURITY FINDINGS

```
+----------------------------------------------------------------------------------------------------+
|                                    SECURITY AUDIT SUMMARY TABLE                                    |
+---------+----------+-------------------------------------------------------------------------------+
| ID      | SEVERITY | TITLE                                                                         |
+---------+----------+-------------------------------------------------------------------------------+
| SEC-01  | CRITICAL | Unrestricted PostgREST Anonymous Enumeration of Public Conversations/Messages|
| SEC-02  | HIGH     | Cross-User Conversation Message Injection & Data Tampering                    |
| SEC-03  | MEDIUM   | User Auth UUID Leakage in Public Share Attachment Payload                     |
| SEC-04  | LOW      | Overly Broad Error Sanitization Regex Masking Legitimate Diagnostics         |
+---------+----------+-------------------------------------------------------------------------------+
```

---

### Finding SEC-01: Unrestricted PostgREST Anonymous Enumeration of Public Conversations & Messages
- **Severity:** **CRITICAL**
- **Affected File & Lines:** `supabase/migrations/20261104_add_public_sharing.sql#L15-L38`
- **Vulnerability Type:** CWE-200: Exposure of Sensitive Information to an Unauthorized Actor / Broken Object Level Authorization (BOLA).

#### Technical Details
The database migration established the following Row-Level Security policy:
```sql
CREATE POLICY "Anyone can view public conversations"
    ON public.conversations
    FOR SELECT
    USING (is_public = true AND public_share_token IS NOT NULL);
```
In Supabase / PostgREST architecture, when an RLS policy evaluates to `true` for `SELECT` without binding the query to a specific parameter, any client possessing the public anonymous key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) can perform table-level queries without supplying a secret share token:
```
GET /rest/v1/conversations?select=id,title,user_id,public_share_token,created_at HTTP/1.1
Host: <supabase-host>
apikey: <NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY>
Authorization: Bearer <NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY>
```
PostgREST will return **ALL** public conversations in the database. Furthermore, because `messages` and `attachments` have foreign keys to `conversations`, an unauthenticated crawler can dump every conversation title, message body, uploaded attachment filename, and internal user ID across the entire platform.

#### Proof of Exploitability / Evidence
A direct HTTP test was conducted against the running Supabase instance using purely anonymous credentials:
```bash
curl -s -X GET "http://127.0.0.1:54321/rest/v1/conversations?select=id,title,public_share_token,is_public" \
  -H "apikey: ${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \
  -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"
```
**Output Returned:**
```json
[
  {
    "id": "c1f7a812-4d2b-4e92-9b21-482a9381a100",
    "title": "Quantum Physics in Vaisheshika",
    "public_share_token": "a98f41e0c8b321...",
    "is_public": true
  }
]
```
The query succeeded without knowing or providing the secret 64-character token. The secret URL token mechanism is completely bypassed.

#### Business & Technical Impact
- Complete loss of confidentiality for users who intended to share their chat only with specific individuals.
- Automated mass scraping of all shared conversations by competitors or malicious crawlers.
- Regulatory violation (GDPR/privacy non-compliance) by exposing internal user identifiers and private research notes.

#### Recommended Remediation
Remove the open `SELECT` policy on the `conversations`, `messages`, and `attachments` tables. Instead, handle public share reads exclusively via a PostgreSQL `SECURITY DEFINER` function or a privileged server-side client that requires the exact token:
```sql
-- Revoke the permissive public RLS policy
DROP POLICY IF EXISTS "Anyone can view public conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can view messages of public conversations" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view attachments of public conversations" ON public.attachments;

-- Restore strict owner-only access for general SELECT
CREATE POLICY "Users can only view their own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = user_id);
```
For the public endpoint (`/api/share/[token]`), use the Supabase Service Role key (or a `SECURITY DEFINER` function `get_public_conversation_by_token(token_text)`) so that only lookups specifying the exact `public_share_token` can retrieve the data.

---

### Finding SEC-02: Cross-User Conversation Message Injection & Data Tampering
- **Severity:** **HIGH**
- **Affected File & Lines:** `src/app/api/chat/route.ts#L76-L107` and `supabase/migrations/20261101_init_schema.sql#L161-L163`
- **Vulnerability Type:** CWE-639: Authorization Bypass Through User-Controlled Key (IDOR).

#### Technical Details
In `src/app/api/chat/route.ts`, when a user sends a message within an existing conversation, the code executes:
```typescript
// Line 76-83:
if (conversationId) {
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", user.id);
  // NOTE: Return value is not checked! If 0 rows updated, execution continues silently.
}
...
// Line 103-107:
await supabase.from("messages").insert({
  conversation_id: conversationId,
  user_id: user.id,
  role: "user",
  content: message,
  status: "completed",
});
```
The database RLS policy on `public.messages` is defined as:
```sql
CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```
Notice that the RLS check on `messages` only verifies that `user_id == auth.uid()`. It **does not verify** that the authenticated user owns the parent `conversation_id`.  
If User A submits a chat request with `conversationId: "<User B's conversation UUID>"`, the update query on `conversations` updates 0 rows (failing silently), but the subsequent `messages.insert` succeeds because `user_id` matches User A's token!

#### Proof of Exploitability / Evidence
1. User B creates a conversation `conv_B` and shares it publicly.
2. User A authenticates with their own valid account.
3. User A sends a `POST /api/chat` payload:
   ```json
   {
     "conversationId": "conv_B",
     "message": "Injected malicious message or disinformation",
     "persona": "veda"
   }
   ```
4. The message is inserted into `conv_B`. When any visitor views `/share/[token]` for `conv_B`, User A's injected message and the AI's response are rendered as part of User B's conversation.

#### Business & Technical Impact
- Tampering and defacement of shared public conversations.
- Cross-tenant data poisoning: inserting misleading, obscene, or fraudulent messages into another user's research archive.
- Destruction of conversation integrity.

#### Recommended Remediation
Explicitly verify ownership of `conversationId` before proceeding in `src/app/api/chat/route.ts`:
```typescript
if (conversationId) {
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conv) {
    return NextResponse.json(
      { error: "Conversation not found or unauthorized access." },
      { status: 404 }
    );
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
```
In addition, update the database RLS policy on `messages`:
```sql
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
CREATE POLICY "Users can insert messages into their own conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = messages.conversation_id AND user_id = auth.uid()
        )
    );
```

---

### Finding SEC-03: User Auth UUID Leakage in Public Share Attachment Payload
- **Severity:** **MEDIUM**
- **Affected File & Lines:** `src/app/api/share/[token]/route.ts#L58`
- **Vulnerability Type:** CWE-200: Information Exposure.

#### Technical Details
When a shared conversation is retrieved by unauthenticated visitors via `GET /api/share/[token]`, lines 56–60 query attachments:
```typescript
const { data: attachments } = await supabase
  .from("attachments")
  .select("id, message_id, file_name, file_size, mime_type, file_path, created_at")
  .eq("conversation_id", conversation.id);
```
In `src/app/api/upload/route.ts#L103`, attachment storage paths are constructed as:
```typescript
const filePath = `${user.id}/${conversationId}/${Date.now()}_${sanitizedFileName}`;
```
Because `file_path` is returned directly to the public client in the JSON payload, the conversation owner's internal Supabase Auth UUID (`user.id`) is exposed to anyone viewing the shared link. While the file cannot be downloaded without ownership (`api/upload/view` checks `startsWith(user.id)`), exposing internal auth identifiers facilitates user correlation and targeted social engineering.

#### Recommended Remediation
Exclude `file_path` from the public select query in `src/app/api/share/[token]/route.ts#L58`:
```typescript
const { data: attachments } = await supabase
  .from("attachments")
  .select("id, message_id, file_name, file_size, mime_type, created_at")
  .eq("conversation_id", conversation.id);
```

---

### Finding SEC-04: Overly Broad Error Sanitization Regex Masking Legitimate Diagnostics
- **Severity:** **LOW / POTENTIAL RISK**
- **Affected File & Lines:** `src/lib/network.ts#L126`
- **Vulnerability Type:** Error Masking / Diagnostic Obfuscation.

#### Technical Details
The error sanitizer regex in `src/lib/network.ts` is:
```typescript
return message.replace(/\b(?:gemini|groq|llama|openai|anthropic|claude|deepseek|model)\b/gi, "the system");
```
The inclusion of `\bmodel\b` replaces common non-proprietary programming terms such as:
- "Data model parse failed" -> "Data the system parse failed"
- "Model binding error" -> "the system binding error"

#### Recommended Remediation
Remove the generic word `model` from the replacement list, or constrain it to provider-specific model phrases:
```typescript
return message.replace(/\b(?:gemini|groq|llama(?:\s*\d+)?|openai|anthropic|claude|deepseek)\b/gi, "the intelligence engine");
```

---

## 5. LATEX & FORMULA RENDERING AUDIT

### 5.1 Test Cases & Results Matrix
The 7 mandated test expressions were evaluated using KaTeX 0.19.1 and the application's markdown preprocessing pipeline in `src/components/MarkdownRenderer.tsx`.

| Case | Mathematical Expression | Expected Behavior | Audit Status | Observation / Output Details |
| :---: | :--- | :--- | :---: | :--- |
| **1** | `$x^2 + y^2 = z^2$` | Inline math KaTeX rendering | **PASS** | Cleanly parsed into `<span class="katex">...</span>`. No delimiter leakage. |
| **2** | `$$\int_0^\infty e^{-x} dx = 1$$` | Display math block centered | **PASS** | Wrapped in `DisplayMathBlock` with "Copy LaTeX" button. KaTeX renders integral symbol accurately. |
| **3** | `\[ \frac{a}{b} \]` | Converted to `$$...$$` display math | **PASS** | Preprocessor converts `\[` to `$$`. Rendered as display block. |
| **4** | `\( a + b \)` | Converted to `$...$` inline math | **PASS** | Preprocessor converts `\(` to `$`. Rendered as inline span. |
| **5** | Raw `\boxed{\begin{aligned} ... \end{aligned}}` | Wrapped in display `$$` with multi-line fbox | **PASS** | Preprocessor wraps unadorned `\boxed{\begin{aligned}` in `$$\n...\n$$`. `.fbox` CSS prevents border collapse. |
| **6** | `\boxed{\begin{aligned} ... \end{aligned}} = 9506` | Trailing math terms preserved in block | **PASS** | Regex encompasses trailing equalities; rendered cleanly inside display math block. |
| **7** | `The solution is $\boxed{x}$.` | Inline math containing `\boxed{}` | **FAIL** | **CRITICAL REGRESSION:** The preprocessor's `wrapStandaloneMathBlocks` regex erroneously splits the sentence into three lines with dangling `$` delimiters. |

---

### 5.2 Deep Dive: Root Cause of Case 7 Failure
In `src/components/MarkdownRenderer.tsx#L123-L130`, the preprocessing logic attempts to wrap unwrapped math blocks:
```typescript
function wrapStandaloneMathBlocks(text: string): string {
  // Regex masks existing code blocks, inline code, and display math $$...$$
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$)/g);
  ...
  // Inside the unmasked parts, it looks for \boxed{\begin{aligned}...} OR \boxed{...}
  const standaloneMathRegex = /(?:\n\s*|^)(\\boxed\s*\{[\s\S]*?\}(?:\s*=\s*[^\n]+)?)(?=\s*(?:\n|$))/g;
}
```
#### Why it breaks:
1. `parts.split` masks `$$...$$`, but **does NOT mask single-dollar inline math `$...$`**.
2. When the user text contains `The solution is $\boxed{x}$.`, the entire string is considered "unmasked markdown text".
3. The regex identifies `\boxed{x}` and replaces it with `$$\n\boxed{x}\n$$`.
4. The resulting output string becomes:
   ```markdown
   The solution is $
   $$
   \boxed{x}
   $$
   $.
   ```
5. `remark-math` cannot parse dangling single dollars followed by display delimiters. KaTeX fails, resulting in raw unformatted dollar signs and fragmented text.

#### Required Fix:
Update `src/components/MarkdownRenderer.tsx#L125` to mask single-dollar math expressions before wrapping standalone blocks:
```typescript
// Include single dollar math (?:\$[^$\n]+\$) in the masking group:
const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
```

---

### 5.3 KaTeX CSS Fix Verification
The overrides in `src/app/globals.css#L180-L215` successfully solve the historic KaTeX `.fbox` bug:
- `box-sizing: border-box !important;` prevents padding from expanding beyond container width.
- `width: 100% !important;` and `display: flex !important;` ensure multi-column aligned equations fill the available space without collapsing to a 0-width column.
- Vertical layout struts inside `.vlist-t` are anchored with `position: relative`, eliminating border truncation in multi-line Vedic math proofs.

---

## 6. FUNCTIONAL & UX AUDIT

### 6.1 Chat Stability & State Management
- **Race Condition Elimination:** When rapidly switching between Conversation A and Conversation B, `activeConversationIdRef.current` ensures that if Conversation A's network promise resolves after Conversation B has been selected, Conversation A's data is safely dropped (`ChatDashboard.tsx#L198-L202`).
- **Browser History Integration:** The `popstate` event listener (`ChatDashboard.tsx#L217-L232`) synchronizes the active chat when the user clicks the browser Back or Forward buttons, properly updating both the message pane and the sidebar selection.
- **In-flight Stream Cancellation:** When starting a new chat via `handleNewChat`, any running SSE connection is immediately terminated via `abortControllerRef.current.abort()` (`ChatDashboard.tsx#L274`).

### 6.2 Kalam Pen Writing Animation & UX
- **Visual Presentation:** The *Kalam* reed pen icon is rendered via `TraditionalKalamIcon` with warm terracotta/amber tones and a gentle angled oscillation (`@keyframes kalam-write`).
- **Synchronization:** The animation starts on the first SSE chunk and terminates synchronously when streaming ends or is aborted.
- **UX Observation:** The icon currently renders as a trailing block-level flex container underneath the message bubble (`MessageBubble.tsx#L236-L240`). While visually pleasing, it does not move horizontally alongside the typing cursor like a true pen. This is acceptable for exhibition purposes but should be noted as a stylistic choice.

### 6.3 Document Attachments & Ingestion
- **File Limits:** Enforces a strict 10MB limit (`MAX_FILE_SIZE = 10 * 1024 * 1024`) in `api/upload/route.ts#L17`.
- **Format Support:** Accurately processes `.txt`, `.docx` (via `mammoth`), and `.pdf` (via `pdf-parse`).
- **Graceful Scanned Document Handling:** If an uploaded PDF contains fewer than 20 characters of extractable text, `extractDocumentText` does not crash; instead, it injects an informational disclaimer:
  `[Notice: This PDF appears to be a scanned document or contains only images without an embedded text layer...]`
- **Storage Cleanup:** When a conversation is deleted (`api/conversations/[id]/route.ts#L67-L91`), all associated files in the `user-uploads` bucket are identified and deleted.

### 6.4 Dark Mode Contrast & Legibility
- **Sources List:** Evaluated in `src/components/SourcesList.tsx`. The dark mode classes `dark:bg-[#1c1510]`, `dark:border-amber-900/40`, and `dark:text-amber-100` achieve a contrast ratio `> 7:1`, exceeding WCAG AAA standards.
- **Manuscript Surface:** The parchment texture in dark mode maintains a readable balance between aged gold headers and muted body text (`dark:text-stone-100`).

### 6.5 Persona Integrity & Guardrails
- **Language Matching:** In `src/lib/personas/router.ts#L112-L138`, user input is classified into `hindi`, `hinglish`, or `english`. In Hindi/Hinglish, all personas adhere to feminine self-reference ("Main vishleshan kar rahi hoon").
- **Crisis Protocols:** The system prompt in `pragya-sarathi-prompt.txt#L49-L63` establishes explicit crisis intervention boundaries with immediate publication of national emergency helplines (Tele-MANAS, KIRAN, 988, 111).

---

## 7. TEST EXECUTION RESULTS & CRITIQUE

### 7.1 Automated Test Execution Log

| Test Command | Scope | Exit Code | Tests Passed | Tests Failed | Audit Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `npx tsc --noEmit` | Full Project TypeScript Compilation | **0** | All | 0 | Clean build; no syntax or type errors. |
| `npx tsx scratch/test-priority1-chat-stability.ts` | P1 Chat Stability, Reset, Deletion, Retry | **0** | 31 | 0 | All 31 mock & logic checks passed. |
| `npx tsx scratch/test-priority2-ancient-experience.ts` | P2 UI, Indicators, Ganita, Prompts | **0** | 35 | 0 | All 35 tests passed; live AI test passed. |
| `npx tsx scratch/test-priority3-priority4.ts` | P3 & P4 Branding, Auth, Share, LaTeX | **0** | 55 | 0 | 55 passed; **CRITICAL AUDIT GAP IDENTIFIED**. |
| `npx tsx scratch/test-full-stabilization.ts` | Language Detection, Search Filter, Net Errors | **0** | 19 | 0 | All 19 checks passed. |
| **Total Test Assertions** | | | **140** | **0** | *(Surface level: 100% pass)* |

---

### 7.2 Critical Critique of Existing Test Suites
Although all 140 automated tests passed with a 100% green status, the audit discovered that the test suites suffer from **significant blind spots and false senses of security**:

1. **Failure to Test PostgREST RLS Table Enumeration:**  
   In `scratch/test-priority3-priority4.ts#L420-L450`, the test verifies that the RLS policy named `"Anyone can view public conversations"` exists in `pg_policies`. The test assumed that because the policy existed, security was satisfied. The test **never attempted an actual negative security query** (i.e. issuing an anonymous `GET /rest/v1/conversations?select=*` without a token) to verify whether unauthorized records could be dumped.
2. **Failure to Test Cross-User Message Insertion:**  
   The test suite tested only that authorized users could send messages. It never tested sending a message with a foreign `conversationId` belonging to another user.
3. **Incomplete LaTeX Regression Suite:**  
   The LaTeX test in `test-priority3-priority4.ts#L330-L380` tested standalone multiline equations (`\boxed{\begin{aligned}...}`), but omitted mixed prose containing inline math (`$ \boxed{x} $`). Consequently, the breaking bug in Case 7 went completely undetected.

---

## 8. DATABASE MIGRATIONS & SCHEMA REVIEW

### 8.1 Migration Inventory & Timeline Analysis

```
supabase/migrations/
├── 20261101_init_schema.sql                      [APPLIED] Core profiles, conversations, messages, attachments
├── 20261102_add_sources_and_response_time.sql    [APPLIED] Adds sources JSONB and response_time_ms
├── 20261103_add_title_customized.sql             [APPLIED] Adds title_customized boolean flag
└── 20261104_add_public_sharing.sql               [APPLIED] [CRITICAL ISSUE] Adds public sharing columns & RLS
```

### 8.2 Migration Review Findings
1. **Future Timestamp Discrepancy (MIG-01):**  
   The migration file `20261104_add_public_sharing.sql` is dated November 4, 2026. Because the current system date is November 2, 2026, future migrations create risks in environments running strict chronological schema state trackers (e.g. Supabase CLI or Flyway), where migrations dated ahead of the current date can block subsequent hotfix migrations.
2. **Missing Rollback Script:**  
   None of the migrations provide down-migration files or idempotent rollback procedures (`DROP POLICY IF EXISTS ...`).
3. **Foreign Key Indexing:**  
   `20261104_add_public_sharing.sql#L10` correctly added `idx_conversations_public_share_token` (`CREATE INDEX IF NOT EXISTS idx_conversations_public_share_token ON public.conversations(public_share_token);`), which ensures `O(log N)` lookup times for public share links.

---

## 9. MISSING TEST COVERAGE & BLIND SPOTS

The following test suites must be created to ensure regression safety:
1. **Security & Authorization Test Suite:**
   - Test that anonymous requests to `/rest/v1/conversations` return empty arrays or 401 Unauthorized.
   - Test that User A cannot read or insert messages into User B's conversation ID via `POST /api/chat`.
   - Test that public share token queries with invalid/revoked tokens return 404 without leaking conversation existence.
2. **Inline & Edge-Case LaTeX Test Suite:**
   - Test inline math containing `\boxed{}` inside sentences.
   - Test multiple inline math formulas in a single sentence: `$a$ and $b$ and $c$`.
   - Test formulas embedded inside Markdown tables and lists.
3. **Public Share Attachment Security Test:**
   - Test that unauthenticated users cannot access files from `user-uploads` via `GET /api/upload/view?path=...`.
   - Test that public share JSON responses omit `file_path`.

---

## 10. PRIORITIZED FIX ROADMAP

```
+----------------------------------------------------------------------------------------------------+
|                                    REMEDIATION ACTION ROADMAP                                      |
+----------+---------+----------------------------------------------+--------------------------------+
| PRIORITY | CODE    | DESCRIPTION                                  | ESTIMATED EFFORT               |
+----------+---------+----------------------------------------------+--------------------------------+
| P0       | SEC-01  | Revoke Permissive Public RLS & Secure Share  | 1 Hour                         |
| P0       | SEC-02  | Enforce Conversation Ownership in api/chat   | 30 Mins                        |
| P0       | LATEX-01| Fix Inline Math Double-Wrapping Regex        | 15 Mins                        |
| P1       | SEC-03  | Strip file_path from api/share/[token]       | 15 Mins                        |
| P1       | SEC-04  | Refine Network Error Sanitization Regex      | 15 Mins                        |
| P2       | MIG-01  | Rename Future-Dated Migration File           | 10 Mins                        |
| P2       | UX-01   | Synchronize Kalam Pen with Typing Cursor     | 2 Hours                        |
| P3       | SEO-01  | Add OpenGraph Social Meta Tags to /share     | 45 Mins                        |
+----------+---------+----------------------------------------------+--------------------------------+
```

---

### Step-by-Step Code Fix Implementation Details

#### P0-1: Remediate SEC-01 (Database RLS Policy)
Create a new migration `supabase/migrations/20261102_fix_public_share_security.sql`:
```sql
-- 1. Drop the insecure public SELECT policies
DROP POLICY IF EXISTS "Anyone can view public conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can view messages of public conversations" ON public.messages;
DROP POLICY IF EXISTS "Anyone can view attachments of public conversations" ON public.attachments;

-- 2. Create a secure PostgreSQL function to retrieve shared conversations strictly by token
CREATE OR REPLACE FUNCTION public.get_public_shared_conversation(lookup_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'conversation', jsonb_build_object(
            'id', c.id,
            'title', c.title,
            'persona', c.persona,
            'created_at', c.created_at,
            'public_shared_at', c.public_shared_at
        ),
        'messages', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', m.id,
                    'role', m.role,
                    'content', m.content,
                    'sources', m.sources,
                    'created_at', m.created_at,
                    'response_time_ms', m.response_time_ms
                ) ORDER BY m.created_at ASC
            )
            FROM public.messages m
            WHERE m.conversation_id = c.id AND m.status = 'completed'
        ), '[]'::jsonb),
        'attachments', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'message_id', a.message_id,
                    'file_name', a.file_name,
                    'file_size', a.file_size,
                    'mime_type', a.mime_type,
                    'created_at', a.created_at
                )
            )
            FROM public.attachments a
            WHERE a.conversation_id = c.id
        ), '[]'::jsonb)
    )
    INTO result
    FROM public.conversations c
    WHERE c.public_share_token = lookup_token
      AND c.is_public = true;

    RETURN result;
END;
$$;
```

#### P0-2: Remediate SEC-02 (`src/app/api/chat/route.ts`)
Add ownership validation before handling message insertion:
```typescript
// Replace lines 76-83 in src/app/api/chat/route.ts:
if (conversationId) {
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", user.id)
    .single();

  if (convError || !conv) {
    return NextResponse.json(
      { error: "Conversation not found or unauthorized access." },
      { status: 404 }
    );
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}
```

#### P0-3: Remediate LATEX-01 (`src/components/MarkdownRenderer.tsx`)
Update `wrapStandaloneMathBlocks` at line 125 to mask single-dollar math expressions:
```typescript
// Replace line 125 in src/components/MarkdownRenderer.tsx:
const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
```

#### P1-1: Remediate SEC-03 (`src/app/api/share/[token]/route.ts`)
Remove `file_path` from the attachment select at line 58:
```typescript
// Replace line 58 in src/app/api/share/[token]/route.ts:
.select("id, message_id, file_name, file_size, mime_type, created_at")
```

---

## 11. FINAL READINESS VERDICT

```
========================================================================================
                                 AUDIT VERDICT
========================================================================================

  TARGET RELEASE:           Pragya AI Public Sharing & Core Features (P1 - P4)
  SECURITY RATING:          CRITICAL RISK (BOLA / Table Enumeration / Data Injection)
  FUNCTIONAL RATING:        GOOD (Strong chat stability, responsive personas, UI polish)
  MATHEMATICS RATING:       CONDITIONAL (Block math renders properly, inline math broken)

  FINAL VERDICT:            NOT READY FOR PRODUCTION DEPLOYMENT
                            (BLOCK RELEASE UNTIL P0 SECURITY & LATEX FIXES ARE APPLIED)

========================================================================================
```

### Release Criteria Checklist
Before enabling public chat sharing in a live production environment, the following conditions must be satisfied:
- [ ] **Condition 1:** Execute migration removing open public `SELECT` policies from `conversations`, `messages`, and `attachments`.
- [ ] **Condition 2:** Migrate `/api/share/[token]` to use the secure `get_public_shared_conversation` RPC or service role lookup.
- [ ] **Condition 3:** Verify that `GET /rest/v1/conversations` with the anonymous key returns zero records.
- [ ] **Condition 4:** Implement ownership check in `src/app/api/chat/route.ts` to block cross-user message injection.
- [ ] **Condition 5:** Apply regex mask fix for single-dollar math in `MarkdownRenderer.tsx` and verify that `The solution is $\boxed{x}$.` renders without errors.

---
*Report compiled independently based on source inspection, live database testing, and runtime verification.*
