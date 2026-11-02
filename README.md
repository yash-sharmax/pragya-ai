<div align="center">

# 🪔 Pragya AI (प्रज्ञा)
### *Synthesizing the Indian Knowledge System (IKS) with Modern Computational Science*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![KaTeX](https://img.shields.io/badge/KaTeX-LaTeX%20Math-005B94?style=for-the-badge)](https://katex.org/)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

<br/>

**Pragya AI** is a full-stack, multilingual, multimodal artificial intelligence platform designed to bridge classical Indian philosophical and scientific heritage with state-of-the-art computational intelligence.

[Explore Architecture](#-architecture--technology-stack) • [Knowledge Personas](#-the-four-knowledge-personas) • [Core Features](#-key-features) • [Getting Started](#-getting-started) • [Deployment](#-deployment-guide)

</div>

---

## 📖 Vision & Philosophy

For millennia, the Indian subcontinent cultivated rigorous epistemic frameworks—from Kanada’s atomic *Vaisheshika* theories and Gautama’s *Nyaya* syllogisms to Aryabhata’s planetary kinematics and Kautilya’s statecraft economics. 

**Pragya AI** brings these foundations to life in an exhibition-grade research workspace:
- **Epistemic Rigor:** Clearly demarcating experimentally verified modern science, theoretical hypotheses, and classical philosophical intuitions—never confusing mythology with empirical proof.
- **Multilingual Intelligence:** Native dynamic language matching across **English**, **Hindi (Devanagari)**, and fluent conversational **Hinglish**.
- **Classical Aesthetics:** An archival parchment manuscript design inspired by ancient folios, accompanied by dynamic calligraphy animations and high-contrast dark mode support.

---

## 🏛️ The Four Knowledge Personas

Pragya AI orchestrates four distinct specialized intelligence personas, each configured with domain-specific system prompts, reasoning protocols, and safety boundaries:

| Persona | Sanskrit Name | Domain & Scope | Foundational Texts & Frameworks |
| :--- | :--- | :--- | :--- |
| **Pragya Veda** | **प्रज्ञा वेद** | Natural Sciences, Astronomy, Cosmology, Epistemology | *Shad-Darshanas* (Nyaya, Vaisheshika, Samkhya), *Aryabhatiya*, *Surya Siddhanta*, *Charaka & Sushruta Samhitas*. |
| **Pragya Neeti** | **प्रज्ञा नीति** | Business Strategy, Leadership, Governance, Ethics | *Arthashastra* (*Saptanga* governance theory, *Shadgunya* market positioning, *Anvikshiki* logic), *Vidura Niti*, *Panchatantra*. |
| **Pragya Ganita** | **प्रज्ञा गणित** | Pure Mathematics, Vedic Math First, Computer Science | *Vedic Mathematics Sutras* (Swami Bharati Krishna Tirtha: *Nikhilam*, *Urdhva-Tiryagbhyam*, *Ekadhikena Purvena*), Big-O analysis, modern calculus fallback. |
| **Pragya Sarathi** | **प्रज्ञा सारथि** | Mindfulness, Well-being, Psychological Resilience | *Patanjali Yoga Sutras* (*Chitta Vritti Nirodha*, *Pratipaksha Bhavana*), *Bhagavad Gita* (*Sthitaprajna*, *Nishkama Karma*), modern CBT/ACT principles. |

> [!IMPORTANT]
> **Crisis Safety Boundaries:** *Pragya Sarathi* operates strictly as an educational and reflective mentor. If acute distress or crisis is detected, it immediately provides national 24/7 mental health emergency helplines (Tele-MANAS `14416`, KIRAN `1800-599-0019`, and international `988` / `111`).

---

## ✨ Key Features

### 📜 Ancient Manuscript Aesthetic & Kalam Writing Animation
- **Archival Surfaces:** Custom `.manuscript-surface` CSS utilities rendering warm aged parchment gradients (`#faf5eb` to `#f4ede0`) in light mode and deep nocturnal archival tones (`#17120d` to `#120e0a`) in dark mode.
- **Kalam Writing Indicator:** A custom animated reed pen (*Traditional Kalam*) oscillates dynamically during Server-Sent Event (SSE) token generation.
- **Truthful Thinking Activity:** Live visual indicators detailing current pipeline phases: `Searching web sources`, `Reading documents`, `Synthesizing knowledge`, and `Writing response`, accompanied by an elapsed time counter.

### 📐 Advanced LaTeX & KaTeX Mathematical Engine
- Seamlessly parses inline `$x^2 + y^2 = z^2$` and display math `$$\int_0^\infty e^{-x} dx = 1$$`.
- **KaTeX `.fbox` Horizontal Anchor:** Overrides KaTeX strut tables to render boxed multi-line Vedic mathematics derivations without border truncation or single-line collapse.
- Dedicated "Copy LaTeX" and "Copy Code" interactive controls with live clipboard feedback.

### 📄 Multi-Format Document Ingestion
- Upload and analyze **PDF**, **DOCX**, and **TXT** files (up to 10 MB per file).
- Server-side text extraction powered by `pdf-parse` and `mammoth`.
- **Scanned Document Resilience:** Automatically identifies image-only or scanned PDFs (`< 20` characters of extractable text) and displays an informative notice without crashing.

### 🔗 Secure Public Chat Sharing
- Publish any research conversation to an unauthenticated public link (`/share/[token]`).
- Cryptographically secure 64-character share tokens (`crypto.randomBytes(32)`).
- **PostgREST RLS Hardening:** Public data is accessed strictly through a PostgreSQL `SECURITY DEFINER` function (`get_public_shared_conversation`), preventing anonymous table enumeration or metadata scraping.
- Generates clean, read-only public views that omit private storage paths and owner identifiers.

### 🔐 Dual Authentication & Password Recovery
- **Google OAuth:** One-click single sign-on with Google Cloud identity.
- **Email/Password:** Full sign-up with password confirmation, live strength validation, and session management.
- **Password Recovery:** Complete `/forgot-password` (privacy-preserving email link dispatch) and `/reset-password` (secure session verification and password updates).

### 🔍 Live Web Source Grounding
- Real-time search integration with relevance filtering.
- High-contrast citations displayed at the bottom of assistant responses with external link previews.

---

## 🛠️ Architecture & Technology Stack

```mermaid
graph TD
    Client["Client Browser (Next.js 14 / Tailwind / KaTeX)"]
    MW["Next.js Edge Middleware (Auth & Session Guard)"]
    API["Next.js Route Handlers (/api/chat, /api/share, /api/upload)"]
    SupabaseAuth["Supabase Auth (Google OAuth & Email/Password)"]
    Postgres[("Supabase PostgreSQL (RLS & SECURITY DEFINER Functions)")]
    Storage["Supabase Storage (user-uploads Private Bucket)"]
    AI["AI Engine Router (Gemini 1.5 Pro & Groq LLaMA 3.3)"]
    Search["Search Grounding Engine"]

    Client --> MW
    MW --> API
    API --> SupabaseAuth
    API --> Postgres
    API --> Storage
    API --> AI
    AI --> Search
```

- **Frontend Framework:** Next.js 14 (App Router) + React 18
- **Styling & Icons:** Tailwind CSS, Shadcn UI primitives, Lucide React
- **Typography & Math:** KaTeX 0.19, `remark-math`, `rehype-katex`
- **Database & Backend:** Supabase PostgreSQL with strict Row-Level Security (RLS)
- **Authentication:** Supabase SSR Auth (`@supabase/ssr`)
- **Document Processing:** `pdf-parse`, `mammoth`
- **AI Intelligence Engines:** Google Gemini 1.5 Pro/Flash & Groq LLaMA 3.3 70B

---

## 📁 Repository Structure

```
├── public/                     # Static assets, icons, and favicons
│   ├── favicon.ico
│   └── icon.svg                # Sacred flame vector icon
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── api/                # API Route Handlers
│   │   │   ├── chat/           # Streaming chat endpoint & context builder
│   │   │   ├── conversations/  # Conversation management & share controls
│   │   │   ├── share/[token]/  # Public read-only share endpoint
│   │   │   └── upload/         # Secure document upload & text extraction
│   │   ├── auth/callback/      # OAuth & password reset PKCE callback
│   │   ├── forgot-password/    # Account recovery request page
│   │   ├── reset-password/     # Secure password reset page
│   │   ├── login/              # Tabbed authentication (Google + Email/Password)
│   │   ├── share/[token]/      # Public shared chat viewer
│   │   ├── globals.css         # Manuscript themes, KaTeX overrides, Kalam animations
│   │   ├── layout.tsx          # Root layout & font configurations
│   │   └── page.tsx            # Main chat interface
│   ├── components/             # Reusable UI components
│   │   ├── BrandLogo.tsx       # Vector flame & mandala brand identity
│   │   ├── ChatDashboard.tsx   # Core chat state machine & history sync
│   │   ├── ChatWorkspace.tsx   # Message stream, composer, and empty state
│   │   ├── MarkdownRenderer.tsx# KaTeX math & syntax-highlighted code renderer
│   │   ├── MessageBubble.tsx   # User & assistant bubbles with Kalam pen animation
│   │   ├── PersonaSelector.tsx # 4-persona switcher
│   │   ├── ShareModal.tsx      # Public link generator & revocation dialog
│   │   ├── Sidebar.tsx         # Conversation history & account drawer
│   │   └── SourcesList.tsx     # High-contrast live source citations
│   └── lib/                    # Core libraries and utilities
│       ├── ai/                 # AI client routers (Gemini, Groq)
│       ├── documents/          # Document text extraction (PDF, DOCX, TXT)
│       ├── personas/           # Persona prompt loader & language detector
│       ├── sources/            # Search grounding & relevance filters
│       └── supabase/           # Server, client, and middleware Supabase wrappers
├── supabase/
│   └── migrations/             # Idempotent forward-only PostgreSQL migrations
│       ├── 20261101_init_schema.sql
│       ├── 20261102_add_sources_and_response_time.sql
│       ├── 20261103_add_title_customized.sql
│       ├── 20261104_add_public_sharing.sql
│       └── 20261105_fix_public_share_and_message_security.sql
├── pragya-ganit-prompt.txt     # System prompt: Mathematics & Vedic Sutras
├── pragya-niti-prompt.txt      # System prompt: Arthashastra Strategy & Ethics
├── pragya-sarathi-prompt.txt   # System prompt: Mindfulness & Well-being
├── pragya-veda-prompt.txt      # System prompt: Natural Sciences & Epistemology
├── .env.example                # Safe environment variable template
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18.17.0 or higher
- **npm** or **pnpm**
- A **Supabase** account with a new or existing project.

### 2. Clone the Repository
```bash
git clone https://github.com/yash-sharmax/pragya-ai.git
cd pragya-ai
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root directory based on `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your respective credentials:
```env
# Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# Groq API
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.3-70b-versatile
```

### 5. Run Database Migrations
Execute the migrations located in `supabase/migrations/` sequentially in your Supabase SQL Editor, or use the Supabase CLI:
```bash
# Apply migrations sequentially:
20261101_init_schema.sql
20261102_add_sources_and_response_time.sql
20261103_add_title_customized.sql
20261104_add_public_sharing.sql
20261105_fix_public_share_and_message_security.sql
```

### 6. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment Guide

### Deploying on Vercel
1. Push your repository to GitHub.
2. Import the repository into [Vercel](https://vercel.com/).
3. Framework Preset: **Next.js**.
4. Configure all environment variables from `.env.example` in the Vercel Dashboard under **Project Settings -> Environment Variables**.
5. Click **Deploy**.

### Custom Domain Configuration (e.g. `pragyaai.yslabs.xyz`)
1. In Vercel, go to **Settings -> Domains** and add `pragyaai.yslabs.xyz`.
2. Add the corresponding `CNAME` record in your DNS provider:
   - **Type:** `CNAME`
   - **Host:** `pragyaai`
   - **Value:** `cname.vercel-dns.com`
3. Update **Supabase Dashboard -> Authentication -> URL Configuration**:
   - **Site URL:** `https://pragyaai.yslabs.xyz`
   - **Redirect URLs:** 
     - `https://pragyaai.yslabs.xyz/auth/callback`
     - `https://pragyaai.yslabs.xyz/reset-password`

---

## 🛡️ Security & Privacy

- **Row-Level Security (RLS):** Every PostgreSQL table enforces strict multi-tenant isolation. Messages and attachments can only be accessed or modified by their verified author.
- **Anti-Enumeration Guard:** Public sharing uses custom database functions preventing unauthorized table dumping.
- **Provider De-branding:** All underlying AI model names and vendor metadata are sanitized before responses reach the user interface.
- **Zero Secret Exposure:** Strict `.gitignore` boundaries protect all local `.env` files, certificates, and OAuth JSON secrets from ever reaching git tracking.

---

## 📜 License & Acknowledgments

This project is open-source and distributed under the **MIT License**.

Developed with reverence for the timeless heritage of the Indian Knowledge Systems (IKS) and dedication to modern scientific computation.

**Author:** [Yash Sharma](https://github.com/yash-sharmax)
