# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

The app lives entirely in the `persona-trainer/` subdirectory. All commands below should be run from there.

```
TrainingSimulatorApp/
├── persona-trainer/        ← the application (work here)
│   ├── src/
│   ├── e2e/
│   ├── sql/
│   ├── knowledge-base/     ← persona profiles, category/topic definitions, usage guidelines
│   └── ...
└── docs/                   ← PRDs and planning documents
```

## Commands

All commands must be run from the `persona-trainer/` subdirectory.

```bash
npm run dev          # dev server at http://localhost:5173
npm run build        # tsc + vite build
npm run lint         # eslint check
npm run test:e2e     # Playwright tests (headless, all browsers)
npm run test:e2e:ui  # Playwright interactive UI mode

# run a single test file
npx playwright test e2e/auth.spec.ts

# run tests matching a name pattern
npx playwright test -g "should redirect to login"

# run in headed mode for debugging
npx playwright test e2e/auth.spec.ts --headed
```

## Architecture

**Persona Trainer** is a workplace communication-skills training app. Users practice conversations with AI-powered personas and receive scored feedback.

### Tech Stack
- **Frontend:** React 19 + TypeScript, Material UI (MUI) v7, React Router v7
- **Build:** Vite 6
- **Backend/DB:** Supabase (PostgreSQL, Auth, Row-Level Security)
- **AI:** OpenAI API — `gpt-4o` for persona roleplay and scoring, `tts-1` for text-to-speech, `whisper-1` for speech-to-text
- **Testing:** Playwright E2E (Chromium / Firefox / WebKit)

### Key Layers

**`src/services/`** — the two external integrations:
- `supabase/client.ts` — single Supabase client instance; exports all DB types (`User`, `Category`, `Topic`, `Scenario`, `Persona`, `Rubric`, `TrainingSession`, `ContentAssignment`)
- `ai/openai.ts` — `OpenAIService` singleton; wraps chat completions, TTS, and STT. Also builds the system prompt that puts the model in persona-as-customer roleplay mode via `createTrainingSystemPrompt()`
- `ai/scoring.ts` — `scoreConversation()` posts a completed transcript + rubrics to OpenAI and parses back a `ScoringResult` (per-rubric scores, strengths, improvement areas). `getPerformanceLevel()` maps percentage to a label/color.

**`src/contexts/AuthContext.tsx`** — wraps Supabase Auth; provides `user` (Supabase auth user), `userProfile` (row from `public.users`), and `loading` via `useAuth()`. Note: `loading` is set to `false` before the profile fetch completes — `userProfile` may be `null` briefly after auth resolves.

**`src/App.tsx`** — routing root; all non-login routes are wrapped in `<ProtectedRoute>` which checks `useAuth()`. Several routes render placeholder `<div>Coming Soon</div>` elements: `/topics`, `/scenarios`, `/scenarios/:id`, `/personas/:id`, `/users`, `/training/:id`, `/history`.

**`src/components/layout/DashboardLayout.tsx`** — sidebar nav with role-based visibility: the Categories, Topics, Scenarios, Personas, Assignments, and Users menu items are only shown when `userProfile.role === 'admin' || 'manager'`. Employees only see Dashboard and Training History.

**`src/components/training/`** — the core UX:
- `TrainingChatModal.tsx` — live chat modal; on open fetches scenario + persona + rubrics from Supabase, builds the system prompt, gets an opening message from the AI in-character, then handles the back-and-forth. Supports TTS (OpenAI tts-1) with adjustable speed, STT (OpenAI whisper-1 via MediaRecorder), and saves a `training_sessions` record on end.
- `ScoringResultsModal.tsx` — displays `ScoringResult` after a session ends; shown while scoring is in progress too.

### Training Flow

`CategoryTraining` page → user clicks a scenario → `TrainingChatModal` opens → on "End Session", `scoreConversation()` fires if rubrics exist → `ScoringResultsModal` shows results → session saved to `training_sessions` with `session_data` JSONB (full transcript + rubrics + scoring result).

### Data Model (Supabase tables)

`categories` → `topics` → `scenarios` → `rubrics`

`personas` are attached to `scenarios` (each scenario has a `persona_id`). `training_sessions` record transcripts and scores. `content_assignments` maps categories to users for structured training programs.

**Visibility pattern:** `categories`, `topics`, `scenarios`, and `personas` all have `is_public` + `created_by` columns. RLS policies enforce: public records visible to all, private records visible only to creator. Queries must use `.or('is_public.eq.true,created_by.eq.USER_ID')` to replicate this in client code.

**`content_assignments` schema quirk:** The table has legacy `assigned_to_id` (required UUID field) and the actual user list is stored in `assigned_users` (UUID array). New code uses `assigned_users`; `assigned_to_id` is populated with a dummy UUID `00000000-0000-0000-0000-000000000000` to satisfy the constraint.

### User Roles

`public.users.role` is one of `'admin' | 'manager' | 'employee'`. New signups default to `'employee'`. Role must be updated manually in Supabase to grant admin/manager access. The `DashboardLayout` sidebar hides content management sections from employees.

### Database Migrations

SQL files in `sql/` are applied manually via the Supabase dashboard or CLI — there is no automated migration runner. `stage-1-setup/` contains initial schema and RLS policies. `stage-2-migrations/` contains incremental changes named by date. User profile creation is handled by a DB trigger (`handle_new_user` in `20251119_add_user_creation_trigger.sql`) that fires on `auth.users` insert.

### Theme

Defined in `src/theme.ts`. Primary color: blue (`#1976d2`). Secondary action buttons (View Topics, Edit) use `color="warning"` (amber `#ffb300`). Font: Nunito for all type except captions (Afacad) and buttons/chips (Roboto).

### Environment Variables
Copy `.env.example` to `.env`:
```
VITE_OPENAI_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

All three are required; the app will log warnings and throw on first use if missing.

### E2E Tests
Tests live in `e2e/` and run against `http://localhost:5173` (Playwright config auto-starts the dev server). Screenshots and video are captured on failure. The config in `playwright.config.ts` retries twice on CI.
