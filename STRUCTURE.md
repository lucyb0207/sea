# Scalable Engineer Academy — Project Structure

> **Stack**: Next.js 14 (App Router) · TypeScript · Tailwind · Supabase · OpenAI · Stripe
> **Phase**: 1 — Validate (auth, learning, quizzes, AI mentor, billing)

---

## Quick start

```bash
git clone <your-repo>
cd sea
cp .env.example .env.local      # fill in your keys
npm install
npx supabase start               # local Supabase (Docker)
npx supabase db push             # run migrations + seed
npm run db:types                 # generate TypeScript types from DB
npm run dev                      # http://localhost:3000
```

---

## Full file tree

```
sea/
│
├── .env.example                 ← copy to .env.local, fill in secrets
├── .gitignore
├── next.config.mjs
├── package.json
├── tailwind.config.ts           ← design tokens, custom colours, animations
├── tsconfig.json
├── middleware.ts                ← auth route protection (runs on every request)
│
├── app/                         ← Next.js App Router
│   │
│   ├── layout.tsx               ← root layout: fonts, Toaster, global providers
│   ├── globals.css              ← Tailwind base + design tokens + prose styles
│   │
│   ├── (auth)/                  ← unauthenticated routes (no sidebar)
│   │   ├── login/page.tsx       ← email/password + Google OAuth
│   │   ├── register/page.tsx    ← signup form + Google OAuth
│   │   └── onboarding/page.tsx  ← 3-step wizard: role → goals → skill assessment
│   │
│   ├── (app)/                   ← authenticated routes (sidebar + topbar layout)
│   │   ├── layout.tsx           ← fetches user, checks onboarding, renders shell
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx         ← skill radar, stats, active path, recent activity
│   │   │
│   │   ├── learn/
│   │   │   ├── page.tsx         ← learning path index (grid of path cards)
│   │   │   └── [path]/
│   │   │       ├── page.tsx     ← path detail: lesson list, progress bar, CTA
│   │   │       └── [lesson]/
│   │   │           └── page.tsx ← lesson page: fetches content + renders renderer
│   │   │
│   │   ├── mentor/
│   │   │   └── page.tsx         ← AI mentor page (usage meter, chat window)
│   │   │
│   │   ├── profile/
│   │   │   └── page.tsx         ← user profile: name, email, plan
│   │   │
│   │   └── settings/
│   │       ├── page.tsx         ← settings nav hub
│   │       └── billing/
│   │           └── page.tsx     ← plan cards, upgrade flow, one-time packs
│   │
│   └── api/                     ← Next.js Route Handlers (backend)
│       ├── auth/
│       │   └── callback/route.ts       ← OAuth callback: exchange code, create profile
│       │
│       ├── progress/
│       │   └── route.ts                ← POST: mark lesson complete, update skill scores
│       │
│       ├── quiz/
│       │   ├── route.ts                ← GET: fetch quiz questions for a lesson
│       │   └── submit/route.ts         ← POST: grade answers, save score, fire streak
│       │
│       ├── streak/
│       │   └── route.ts                ← POST: update daily streak (idempotent)
│       │
│       ├── mentor/
│       │   └── chat/route.ts           ← POST: streaming OpenAI chat, saves conversation
│       │
│       ├── billing/
│       │   ├── checkout/route.ts       ← POST: create Stripe Checkout session
│       │   └── portal/route.ts         ← POST: open Stripe customer portal
│       │
│       ├── webhooks/
│       │   └── stripe/route.ts         ← POST: handle Stripe lifecycle events
│       │
│       └── waitlist/
│           └── route.ts                ← POST: add email to waitlist table
│
├── components/
│   │
│   ├── ui/                      ← base design system components
│   │   ├── button.tsx           ← Button with variants, loading, icons (CVA)
│   │   ├── input.tsx            ← Input + Textarea with label, error, hint
│   │   └── primitives.tsx       ← Badge, Card, ProgressBar, Skeleton
│   │
│   ├── layout/                  ← app shell
│   │   ├── app-sidebar.tsx      ← nav links, streak display, level bar, user
│   │   └── app-topbar.tsx       ← breadcrumbs, user dropdown, sign out
│   │
│   ├── dashboard/               ← dashboard widgets
│   │   ├── active-path-widget.tsx   ← current path card + path list (+ re-exports)
│   │   ├── achievement-shelf.tsx    ← re-exports AchievementShelf
│   │   ├── recent-activity.tsx      ← re-exports RecentActivity
│   │   ├── skill-radar.tsx          ← recharts RadarChart for 6 skills
│   │   ├── stats-bar.tsx            ← streak / XP / lessons / achievements row
│   │   └── weak-spot-alert.tsx      ← re-exports WeakSpotAlert
│   │
│   ├── learn/                   ← lesson UI
│   │   ├── lesson-renderer.tsx  ← MDX render, complete button, XP trigger, prev/next
│   │   ├── lesson-nav.tsx       ← sticky left sidebar with lesson list
│   │   ├── quiz-block.tsx       ← full quiz UI: questions → submit → results
│   │   └── xp-animation.tsx     ← floating "+25 XP" animation on completion
│   │
│   ├── mentor/
│   │   └── mentor-chat-window.tsx  ← streaming chat, history sidebar, usage meter
│   │
│   └── settings/
│       ├── billing-client.tsx   ← plan cards, one-time packs, Stripe checkout trigger
│       └── profile-client.tsx   ← edit name/username form, danger zone
│
├── lib/
│   ├── supabase.ts              ← createClient() / createServerSupabaseClient() / createServiceClient()
│   ├── utils.ts                 ← cn(), formatDate(), formatRelativeTime(), truncate()
│   ├── xp.ts                   ← LEVELS[], getLevelFromXP(), getLevelProgress(), XP_REWARDS
│   └── analytics.tsx            ← PostHog provider + typed track.* event helpers
│
├── hooks/
│   └── index.ts                 ← useUser(), useSkillScores(), useXP(), useLessonProgress()
│
├── types/
│   ├── index.ts                 ← all shared TS types (UserProfile, Lesson, etc.)
│   └── database.types.ts        ← Supabase generated types (run: npm run db:types)
│
└── supabase/
    ├── config.toml              ← local Supabase config (ports, auth providers)
    └── migrations/
        ├── 001_initial_schema.sql  ← all tables, RLS policies, triggers, seed achievements
        └── 002_seed_content.sql    ← Foundations + Databases lesson content + quiz questions
```

---

## Key architectural decisions

### Route groups
`(auth)` and `(app)` are Next.js route groups — they share a layout without affecting the URL.
- `(auth)` pages: no sidebar, full-screen split layout
- `(app)` pages: sidebar + topbar, max-width content area

### Data fetching pattern
- **Server components** (page.tsx files) fetch data directly via `createServerSupabaseClient()`
- **Client components** get data passed as props, or fetch via API routes
- **API routes** handle mutations (progress, streak, billing, AI chat)

### Auth flow
```
Register/Google → OAuth callback (/api/auth/callback)
  → new user? → create users row → redirect /onboarding
  → existing? → redirect /dashboard

middleware.ts checks every request:
  → protected route + no session → redirect /login?redirectTo=...
  → auth route + has session → redirect /dashboard
```

### AI mentor streaming
The `/api/mentor/chat` route uses the OpenAI streaming API and returns a
`text/event-stream` response. The client reads chunks and appends to the
message state in real time. Conversation is saved to Supabase after the stream
closes.

### Stripe flow
```
User clicks upgrade
  → POST /api/billing/checkout → creates Stripe Checkout session → redirect
User completes payment on Stripe
  → Stripe fires checkout.session.completed webhook
  → POST /api/webhooks/stripe → updates users.plan = 'pro'
User manages subscription
  → POST /api/billing/portal → Stripe Customer Portal → redirect
```

---

## Phase 2 additions (not yet built)

These routes and components are referenced in the sidebar but locked behind
Pro — they'll be built in Phase 2:

```
app/(app)/architect/           ← architecture drag-and-drop builder (React Flow)
app/(app)/simulate/            ← scenario simulator (decision trees)
app/api/designs/               ← CRUD + AI feedback for architecture designs
app/api/scenarios/             ← scenario sessions + choice outcomes
components/architect/          ← ArchCanvas, ComponentPalette, FeedbackPanel
components/simulate/           ← ScenarioIntro, DecisionStep, OutcomeReveal
```

---

## Environment variables

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API |
| `OPENAI_API_KEY` | platform.openai.com/api-keys |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| `RESEND_API_KEY` | resend.com/api-keys |
| `NEXT_PUBLIC_POSTHOG_KEY` | app.posthog.com → project settings |
| `UPSTASH_REDIS_REST_URL` | console.upstash.com |

---

## Database tables (Phase 1)

| Table | Purpose |
|-------|---------|
| `users` | Extends `auth.users` — plan, streak, onboarding status |
| `learning_paths` | Path metadata (slug, title, icon, skill_tags) |
| `lessons` | Lesson content in MDX, type, XP reward |
| `quiz_questions` | Questions + options + correct answer for quiz lessons |
| `user_progress` | Per-user per-lesson completion status + score |
| `skill_scores` | 6 skill scores (0–100) per user, updated on lesson complete |
| `achievements` | Achievement definitions (key, title, icon, XP) |
| `user_achievements` | Which achievements each user has earned |
| `mentor_conversations` | Full message history for AI mentor chats |
| `waitlist` | Pre-launch email capture |

All tables have **Row Level Security** enabled. Users can only read/write their own data.

---

## Commands reference

```bash
npm run dev              # start dev server
npm run build            # production build
npm run type-check       # tsc without emitting (CI check)
npm run db:types         # regenerate Supabase TypeScript types

npx supabase start       # start local Supabase (requires Docker)
npx supabase db push     # push migrations to local DB
npx supabase db reset    # reset local DB and re-run all migrations

stripe listen \
  --forward-to localhost:3000/api/webhooks/stripe  # forward Stripe webhooks locally
```
