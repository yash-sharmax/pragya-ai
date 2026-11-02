# Pragya AI — Execution Checklist & Evidence Verification Specification

**Theme:** Indian Knowledge System (IKS) & Modern Science  
**Purpose:** Agreed requirements and decisions for the implementation phase.

## 1. Product vision and personas

Build a responsive, account-based, multilingual AI application with four specialized personas:

- **Pragya Veda:** Science, physics, astronomy, cosmology, nature and human-body topics; compare traditional texts with modern knowledge carefully.
- **Pragya Neeti:** Business strategy, entrepreneurship, management, leadership, governance and ethics.
- **Pragya Ganita:** Mathematics, geometry, Vedic Mathematics, computer science, algorithms and computational thinking.
- **Pragya Sarathi:** Psychology, self-development, emotional well-being, attention and self-reflection. It must not diagnose or present itself as a therapist/doctor; provide appropriate crisis/professional-help guidance.

Support Hindi, English and Hinglish. Normally reply in the user's language. Display original Sanskrit in Devanagari.

## 2. Agreed technology and architecture

- Frontend: Next.js App Router.
- UI: Tailwind CSS, Shadcn UI, Lucide React.
- Backend, database, auth and storage: Supabase.
- Database: Supabase PostgreSQL.
- Authentication: Supabase Auth with Google OAuth.
- AI providers: Gemini for Veda, Neeti and Sarathi; Groq for Ganita.
- Evidence retrieval: live internet search at answer time. **Do not build a separate curated Sanskrit verse database for the initial version.**
- Deployment target: Vercel frontend + Supabase backend.
- Use server-side code for provider calls and secret keys.

**Environment decision:** Continue using the existing `.env` file for local development. Do not replace its credentials or create `.env.local` unless approved. Keep `.env` and Google OAuth client-secret JSON out of Git. Create `.env.example` with placeholders only. Never print secrets in logs or reports.

## 3. Application feature checklist

### Authentication and profile
- [ ] Google Sign In / Sign Up and sign out.
- [ ] Personal profile and avatar.
- [ ] Secure account deletion, including associated data and stored files.

### Chat
- [ ] New chat and persona selection.
- [ ] Each conversation remains associated with its selected persona.
- [ ] Recent chat history.
- [ ] Search previous conversations and messages.
- [ ] Rename and delete chats.
- [ ] Persist user and assistant messages.
- [ ] Loading, failed and retry states.
- [ ] Preserve useful context in follow-up messages.
- [ ] Explain clearly when chat-history saving is disabled.

### AI and multimodal
- [ ] Route each persona to its configured AI provider/model.
- [ ] Keep AI provider calls server-side.
- [ ] Hindi, English and Hinglish support.
- [ ] Image upload and image understanding using a model that actually supports vision.
- [ ] Initial image target: JPEG, PNG and WEBP, up to 5 MB, subject to provider limits.
- [ ] Do not assume a storage URL alone enables image understanding.

### Evidence and feedback
- [ ] Live web search for relevant Sanskrit passages, sutras, verses and sources.
- [ ] Evidence Box with relevant AI answers.
- [ ] Show source title, clickable original URL, text/reference details where available, access date and verification explanation.
- [ ] Automated evidence confidence score from 0 to 99; never display 100.
- [ ] Explain that the score is an automated estimate, not proof or scholarly certification.
- [ ] Display a notice that the material was found at the listed source and users may inspect the original source manually.
- [ ] Optional **Like** and **Dislike** buttons.
- [ ] No separate “Submit Review” button or user-operated approval workflow.
- [ ] Users may do nothing; feedback is optional.
- [ ] Like/dislike must not automatically change the score or certify/ invalidate a reference.
- [ ] Never fabricate Sanskrit text, verse numbers, translations, authors or URLs.
- [ ] If reliable evidence is unavailable, say so plainly.

### Settings and responsive UI
- [ ] Preferred language: English, Hindi or Hinglish.
- [ ] Theme: Light, Dark or System.
- [ ] Default persona setting.
- [ ] Chat-history preference.
- [ ] Responsive desktop, tablet and mobile layouts.
- [ ] Accessible labels, keyboard focus, empty and error states.

## 4. Evidence Box behaviour

Search the internet when a question needs an IKS/Sanskrit reference. Prefer primary texts, reputable digital libraries, academic institutions and recognized repositories over random blogs or copied quote websites.

Suggested discovery sources (not an automatic guarantee of accuracy or reuse rights):
- Vedic Heritage Portal — https://vedicheritage.gov.in/
- Gita Supersite, IIT Kanpur — https://www.gitasupersite.iitk.ac.in/
- SARIT — https://sarit.indology.info/
- Muktabodha Digital Library — https://www.muktabodha.org/
- Sanskrit Documents — https://sanskritdocuments.org/

Required workflow:
1. Search for the relevant passage online.
2. Open and inspect the actual source page where possible; do not rely only on search snippets.
3. Cross-check against another independent, credible source when available. Copies/mirrors of one source do not count as independent.
4. Compare Sanskrit text, work title, chapter/verse/sutra identifier and translation separately.
5. Preserve exact source URLs and explain what was and was not checked.
6. Distinguish a source match from an interpretation or scientific claim.
7. State uncertainty when sources disagree, a page is inaccessible or the passage cannot be confirmed.
8. Do not assume that online availability grants permission to reproduce copyrighted translations. Prefer public-domain or clearly reusable material; otherwise show only legally appropriate content and link to the source.

Suggested Evidence Box fields:
- Evidence heading/short description.
- Original Sanskrit text, only when retrieved and sufficiently matched.
- Transliteration, if available and checked.
- Work/granth name and chapter/verse/sutra/section reference.
- Translation and translator/edition details, if available.
- Source title and clickable original URL.
- Source access date.
- Automated score (0–99), breakdown and short explanation.
- Manual-check notice.
- Optional Like and Dislike controls.

If a field cannot be confirmed, omit it or label it “not confirmed”; never guess.

## 5. Automated evidence confidence score

**Maximum displayed score: 99/100. Never display 100.**

The score reflects observable retrieval and comparison checks. It is not a probability, guarantee of authenticity or scholarly certification.

| Parameter | Weight | What is checked |
|---|---:|---|
| Original Sanskrit text match | 30 | Does the retrieved Sanskrit passage match the source? Are there material wording differences? |
| Work and location match | 25 | Do the work name and chapter/verse/sutra/section locator match? |
| Independent source agreement | 20 | Do independent credible sources support the same passage and locator? |
| Translation consistency | 15 | If shown, is the translation attributed and consistent with the source? Is translator/edition identifiable? |
| Source credibility and provenance | 10 | Is the source identifiable, reputable and traceable to an edition, institution or primary text? |
| **Total** | **100** | |

### Score interpretation
- **90–99:** Very strong source match; still not a guarantee or scholarly certification.
- **75–89:** Strong source match; some details may remain incomplete.
- **50–74:** Partial source match; important details remain uncertain.
- **1–49:** Weak source match; communicate uncertainty clearly.
- **0:** No usable match; do not present the passage as verified.

### Scoring safeguards
- Award points only for checks actually performed.
- Do not count copied websites as independent confirmation.
- Missing/inaccessible original sources reduce confidence.
- If Sanskrit text or reference materially conflicts with the source, do not present it as a confirmed quotation regardless of score.
- If no reliable source is found, show **“No verified reference found”** rather than a reassuring-looking score.
- Never say “100% verified”, “guaranteed authentic” or “scholar approved”.
- A high source-match score does not prove a modern scientific interpretation.
- Keep evidence confidence separate from the scientific/factual correctness of the AI explanation.
- The implementation must calculate the score from explicit structured checks, not ask the language model to invent a number. If reliable scoring is not possible, show **“Score unavailable”**.

## 6. Like / Dislike rules

- Like means the user found the Evidence Box useful/helpful.
- Dislike means the user found it unhelpful or potentially incorrect.
- Both are optional; no selection is valid.
- Do not force an explanation.
- If stored, link feedback to the user (if signed in), message and evidence item, subject to privacy settings.
- Prevent unlimited duplicate votes; allow changing Like to Dislike and vice versa.
- Likes are not proof of authenticity; Dislikes are not proof a source is false.
- Feedback must not automatically change the evidence score or verification status.
- Aggregate feedback may help administrators identify items needing investigation.

## 7. Security, database and storage

- [ ] Use Supabase-managed `auth.users`; do not create a parallel auth system.
- [ ] Tables for profiles, user settings, conversations, messages, attachment metadata, message evidence and evidence feedback.
- [ ] Store actual uploads in private Supabase Storage buckets.
- [ ] Buckets already created: `user-uploads` private, `user-avatars` private, `public-assets` public.
- [ ] Enable and test RLS on all user-owned tables.
- [ ] Users can access only their own profiles, settings, chats, messages and attachments.
- [ ] Validate file ownership and storage paths; a user ID in a path alone is not security.
- [ ] Keep API keys and service-role credentials server-side only.
- [ ] Save user message as pending before AI call; mark failed on error; save assistant response on success.
- [ ] Account deletion removes associated database rows and stored files safely.
- [ ] Add reasonable rate limits and upload/request limits.

**No permanent curated Sanskrit verse database in the initial version.** Use live web search. Store only evidence/result metadata and feedback needed for chat history, traceability and product functionality. Do not turn search results into a claimed verified corpus.

## 8. Manual setup previously reported complete

These were previously checked through the user's dashboard review workflow. Recheck only if implementation reveals a problem:
- [x] Supabase project created.
- [x] Google OAuth client created in Google Cloud.
- [x] Supabase Google provider configured.
- [x] OAuth callback URL configured.
- [x] Supabase Site URL set to `http://localhost:3000`.
- [x] Local redirect URL set to `http://localhost:3000/**`.
- [x] Email authentication enabled (previously reported).
- [x] Storage buckets created with intended visibility.
- [x] Existing `.env` file present.
- [x] Four persona prompt files present.
- [x] PRD PDF present.

These are not end-to-end tested yet. Google login must be tested after the frontend exists.

## 9. Existing workspace notes

Project root:
`/home/dilip/Desktop/Yash's Projects/Pragya AI`

Previously found files:
- `Pragya_AI_PRD.pdf`
- `pragya-veda-prompt.txt`
- `pragya-niti-prompt.txt`
- `pragya-ganit-prompt.txt`
- `pragya-sarathi-prompt.txt`
- `.env`
- Google OAuth client-secret JSON file

Previously found environment variable names (values must remain private):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_MODEL`
- `GROQ_MODEL`
- `DATABASE_URL`

Machine previously reported Node.js/npm and Docker installed. Supabase CLI was not installed at the time of audit. No Next.js app scaffold existed at that time.

The parent `/home/dilip` is already a Git repository. Initialize a separate Git repository inside the Pragya AI project folder before using Git there.

## 10. Antigravity execution and safety checklist

- [ ] First inspect the PRD, four persona prompt files, `.env` variable names and workspace.
- [ ] Preserve existing credentials and files unless change is necessary and approved.
- [ ] Never print, expose, commit or upload `.env` values or Google OAuth client-secret JSON.
- [ ] Create project-local `.gitignore` before Git staging.
- [ ] Ignore `.env`, `.env.*` except `.env.example`, OAuth client-secret JSON, `node_modules`, `.next`, build output and local Supabase temporary files.
- [ ] Create `.env.example` with placeholders only.
- [ ] Initialize Git inside the project directory, not its parent.
- [ ] Do not stage, commit or push without explicit approval.
- [ ] Build in phases and run checks/tests after each phase.
- [ ] Do not claim features are complete unless implemented and tested.
- [ ] Do not invent successful OAuth, AI, image, evidence-search or database tests.
- [ ] Report blockers, missing credentials, provider limitations and manual dashboard steps.
- [ ] At completion, report files changed, features implemented, tests/results, remaining work, manual actions and safe run instructions.

## 11. Final acceptance checklist

- [ ] Google sign-in works end-to-end.
- [ ] User can create, continue, search, rename and delete chats.
- [ ] All four personas use their correct prompt and AI provider.
- [ ] Hindi, English and Hinglish work in real conversations.
- [ ] Image upload and image understanding work with a supported model.
- [ ] Evidence Box searches the internet and provides traceable source links.
- [ ] Evidence score is based on explicit checks, never exceeds 99, and explains uncertainty.
- [ ] Missing/conflicting evidence is handled honestly without fabricated citations.
- [ ] Like and Dislike work as optional feedback and do not certify evidence.
- [ ] RLS protects users' private data.
- [ ] Secrets are not exposed in frontend bundles, logs or Git.
- [ ] Mobile and desktop layouts are usable.
- [ ] Core flows and error states are tested.
- [ ] Final implementation report is delivered.

**End of specification.**
