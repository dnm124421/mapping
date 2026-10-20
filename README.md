# Roadmap Planner ("Master any skill")

> A full-stack, production-grade learning operating system built on the **"Prompt → JSON → App"** engine. Master any skill without overwhelm in structured, bite-sized 30-day sprint chunks.

---

## 🌟 The Philosophy: Calm Clarity & Zero API Bills

Most AI learning tools require expensive, complex LLM API keys and deliver generic, ungrounded advice. **Roadmap Planner** takes a fundamentally different approach:

1. **You Bring Your Own AI**: Copy pre-compiled, battle-tested prompt templates (Prompt A, B, C) into **ChatGPT, Claude, or Gemini**.
2. **Strict JSON Engine**: Paste the AI output back into the app. Our tolerant parser cleans markdown fences, repairs curly quotes/trailing commas, and validates everything against strict Zod schemas.
3. **Structured Execution**: Your roadmap turns into an interactive curriculum, a 30-day daily agenda, a deep focus timer, and long-term telemetry.
4. **Forgiving by Design**:
   - Missed tasks never cause shame; they turn into **Gentle Catch-Up** recommendations.
   - **Rest days never break your streak**.
   - A **3-day forgiveness buffer** bridges occasional life interruptions.
5. **Zero Fake Metrics**: Streaks, velocity, study minutes, and 90-day activity heatmaps are 100% computed from real data.

---

## 🚀 The 3-Step Core Loop

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    PROMPT A     │  ──>  │    PROMPT B     │  ──>  │    PROMPT C     │
│  Full Roadmap   │       │  First 30 Days  │       │  Next 30 Days   │
│  (4 - 5 Stages) │       │  (Daily Sprint) │       │  (Chunk Ritual) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Step 1: Prompt A (Roadmap)**: Generates 4–5 sequential stages from beginner to mastery with topic IDs (`1.1`, `1.2`), subtopics, estimated minutes, and free verified study links.
- **Step 2: Prompt B (First 30-Day Chunk)**: Compiles only the first 30 days in detail (2–4 bite-sized tasks/day, rest days, weekly review, acceptance criteria).
- **Step 3: Prompt C (Next 30 Days & Ritual)**: At the end of every 30-day sprint, the app aggregates your actual completion rate, mastered topics, and reflections into Prompt C for Chunk 2.

---

## 🛠️ Tech Stack & Architecture

- **Frontend & App Engine**: Next.js 14 App Router, TypeScript (Strict Mode), Tailwind CSS v3.4 (with Calm Clarity design tokens).
- **Backend & Database**: Supabase Free Tier (PostgreSQL, Row Level Security, Auth with Google OAuth + Email, atomic SQL procedures).
- **Validation**: Zod canonical schemas for Roadmaps, Plans, Days, and Tasks.
- **Testing**: Vitest test suites verifying schemas, tolerant JSON repairs, streak calculations, and prompt builders (28/28 tests passing).
- **Hosting Target**: Vercel Free Tier (zero server maintenance).

---

## 📁 Repository Structure

```
to do app/
├── src/
│   ├── app/
│   │   ├── (auth)/                # Google OAuth, Email login & password reset
│   │   ├── (app)/                 # Authenticated App Shell with Sidebar & Dock
│   │   │   ├── page.tsx           # Home Dashboard (Live telemetry & today tasks)
│   │   │   ├── roadmaps/          # Skill roadmaps list & 3-step import wizard
│   │   │   ├── plans/             # 30-day daily plans & DateStrip agenda
│   │   │   ├── focus/[taskId]/    # Tab-sleep safe deep focus timer
│   │   │   ├── history/           # 90-day consistency heatmap & CSV export
│   │   │   └── settings/          # Data Vault, JSON backups & profile
│   │   └── layout.tsx             # Root layout with Calm Clarity tokens
│   ├── components/
│   │   ├── providers/             # AuthProvider with Supabase integration
│   │   └── shell/                 # Sidebar, TopBar, BottomDock, SyncPill, ThemeToggle
│   └── lib/
│       ├── data/                  # Roadmaps, Plans, and Local Storage fallbacks
│       ├── logic/                 # Streak engine, date normalizer, plan status
│       ├── json-extract.ts        # Tolerant JSON repairer & diagnostic linter
│       ├── prompts.ts             # Live compilers for Prompts A, B, and C
│       └── schemas.ts             # Canonical Zod schemas
├── supabase/
│   ├── schema.sql                 # 10 tables, complete RLS policies & RPC function
│   └── seed-sample.json           # Canonical sample roadmap & 30-day plan
└── package.json
```

---

## ⚡ Quick Start & Local Development

### 1. Prerequisites
- Node.js 18.17+ or 20+
- npm (on Windows PowerShell, execute with `npm.cmd`)

### 2. Install Dependencies
```bash
npm.cmd install
```

### 3. Run Unit Tests
```bash
npm.cmd test
```
All 28 tests across 4 suites (`schemas`, `json-extract`, `logic`, `prompts`) will run and pass.

### 4. Supabase Setup (Optional for Cloud Sync)
Create a free project at [supabase.com](https://supabase.com):
1. Navigate to the **SQL Editor** in your Supabase dashboard.
2. Paste and run the entire contents of `supabase/schema.sql`.
3. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
> **Note**: Even without Supabase credentials, the application includes a seamless offline/local storage fallback for every screen and feature!

### 5. Launch Development Server
```bash
npm.cmd run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Production Build
```bash
npm.cmd run build
```
Creates an optimized static/dynamic production bundle verified across all 14 routes.

---

## 🗺️ Route Directory

| Route | Description |
|---|---|
| `/` | Live Home Dashboard with streak, weekly rhythm, and today's tasks |
| `/roadmaps` | Skill Curricula list with stage filters, search, and JSON export/import |
| `/roadmaps/new` | 3-Step AI Import Wizard (Prompt A compiler + live lint diagnostics) |
| `/roadmaps/[id]` | Interactive Stage Accordion with Dossier and topic checkoffs |
| `/plans` | 30-Day Sprint Plans list with status chips ("On Track", etc.) |
| `/plans/new` | 30-Day Sprint Creator (Prompt B compiler + plan validator) |
| `/plans/[id]` | Today's Agenda with 30-day DateStrip and Gentle Catch-Up banner |
| `/plans/[id]/chunk-end` | 30-Day Chunk End Ritual (metrics, reflection, Prompt C, Chunk 2) |
| `/focus/[taskId]` | Deep Study Timer (tab-sleep safe, streak shield, session logger) |
| `/history` | 90-day activity heatmap matrix, telemetry stats, and CSV export |
| `/settings` | Profile preferences, AI engine selector, and full JSON Data Vault |
| `/login` | Supabase Auth with Google OAuth and Email magic links |
| `/onboarding` | 3-step first-run walkthrough introducing the Prompt-JSON loop |

---

## 📄 License
MIT. Built with care for lifelong learners.
