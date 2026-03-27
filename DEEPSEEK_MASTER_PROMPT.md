# DeepSeek Master Prompt — CraftID (Full Project Handoff)

Use this as your **single source of truth** when handing off to DeepSeek.

---

## How to use this file
1. Copy everything from **BEGIN MASTER PROMPT** to **END MASTER PROMPT**.
2. Paste into DeepSeek.
3. Ask DeepSeek to first summarize understanding, then propose an implementation plan before coding.

---

## BEGIN MASTER PROMPT

You are continuing an in-progress Next.js project called **CraftID**.
Your task is to work as a senior full-stack engineer and product-aware architect.

Read this prompt carefully and treat it as authoritative project context.

---

## A) Product understanding (what this app is)

**CraftID** is an MVP web app for Nigerian artisans.
Core idea:
- Artisans receive payments through a payment link / QR.
- Transaction behavior forms a **CraftScore**.
- CraftScore unlocks financial products (loan, virtual card, etc.).

Current implementation is primarily **frontend + mocked data**, with polished UI flows and no real persisted backend data yet.

---

## B) Your key question answered: Sign In vs Get Started vs Onboarding

### 1) What "Sign In" currently does
On landing page, **Sign In** links directly to `/dashboard`.
- It behaves as a **placeholder login action**.
- There is **no real authentication gate** currently.
- Users are not actually validated.

### 2) What "Get Started" currently does
On landing page, **Get Started** links to `/onboarding`.
- It starts a multi-step profile setup flow.
- It collects identity/profile details in local component state.
- On completion, it routes to dashboard and simulates account readiness.

### 3) Difference in product terms
- **Sign In** = returning user intent (should authenticate existing account).
- **Get Started / Onboarding** = new user intent (should create account/profile and then continue into app).

### 4) Are we adding Supabase auth right now?
Current codebase state: **No Supabase integration yet**.
- No `supabase-js` setup exists.
- No auth middleware/guards exist.
- No session/cookie checks are enforced.

So right now:
- Sign In is UI-only navigation.
- Onboarding is UI-only workflow.

If you add real auth later, recommended flow:
- Sign In → Auth page → session creation → dashboard
- Get Started → Sign Up/Auth → Onboarding → dashboard

---

## C) Technology stack
- Next.js App Router (`next@16.2.1`)
- React 19
- TypeScript strict mode
- Tailwind CSS v4 + custom CSS variables
- Framer Motion (animations)
- Lucide React (icons)
- Recharts (charts)
- qrcode.react (QR)

NPM scripts:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

---

## D) High-level architecture

### Routing model
- Public marketing in route group: `(landing)`
- Signed-in area: `dashboard`, `score`, `loan`, `card`
- Setup flow: `onboarding`
- Public payment route: `pay/[username]`

### Shared signed-in shell
A reusable authenticated shell exists:
- `components/authenticated-layout.tsx`
  - renders `NavSidebar`
  - applies shared page spacing/padding

Used by route layouts:
- `app/dashboard/layout.tsx`
- `app/score/layout.tsx`
- `app/loan/layout.tsx`
- `app/card/layout.tsx`

### Navigation component
`components/nav-sidebar.tsx` includes:
- Desktop fixed left sidebar
- Mobile fixed bottom nav
- Links: Home, CraftScore, Loans, My Card, Settings (`/onboarding`)

---

## E) Current folder structure (core)
```txt
app/
  layout.tsx
  globals.css
  icon.svg
  (landing)/
    layout.tsx
    page.tsx
    components/
      hero.tsx
      stats.tsx
      how-it-works.tsx
      testimonials.tsx
      cta.tsx
  dashboard/
    layout.tsx
    page.tsx
    components/
      dashboard-nav.tsx
  score/
    layout.tsx
    page.tsx
  loan/
    layout.tsx
    page.tsx
  card/
    layout.tsx
    page.tsx
  onboarding/
    page.tsx
  pay/[username]/
    page.tsx

components/
  authenticated-layout.tsx
  nav-sidebar.tsx
  craft-score-gauge.tsx
  stats-card.tsx
  transaction-feed.tsx
  payment-link-card.tsx
  virtual-card.tsx

lib/
  mock-data.ts
  utils.ts

AGENTS.md
CLAUDE.md
CLAUDE_HANDOFF_PROMPT.md
DEEPSEEK_MASTER_PROMPT.md (this file)
package.json
next.config.ts
tsconfig.json
```

Note: there is an extra nested folder `my-app/app/(landing)` that appears accidental/unused.

---

## F) File-by-file behavior summary

### 1) Root app files
- `app/layout.tsx`
  - Loads fonts: Syne, DM Sans, DM Mono via `next/font/google`
  - Sets metadata title/description for CraftID
- `app/globals.css`
  - Defines custom theme tokens (surfaces, border, text, brand colors)
  - Global input styles and scrollbar styles
- `app/icon.svg`
  - Custom app icon

### 2) Landing area `(landing)`
- `app/(landing)/layout.tsx`
  - Fixed header + nav links
  - CTA actions:
    - Sign In -> `/dashboard`
    - Get Started -> `/onboarding`
  - Footer branding
- `app/(landing)/page.tsx`
  - Assembles sections: Hero, Stats, HowItWorks, Testimonials, CTA
- `app/(landing)/components/*`
  - Marketing sections with motion and brand visuals

### 3) Dashboard and signed-in pages
- `app/dashboard/page.tsx`
  - Business snapshot, earnings chart, stats cards, score preview, loan CTA, transaction feed
- `app/score/page.tsx`
  - Score gauge, score factors, history chart, unlock tiers
- `app/loan/page.tsx`
  - Loan offer details, amount slider, repayment breakdown, acceptance state
- `app/card/page.tsx`
  - Virtual card display, freeze/unfreeze action, card utility actions

### 4) Onboarding
- `app/onboarding/page.tsx`
  - 4-step onboarding flow (identity, craft, rates, verification)
  - Success state provides payment link + QR + share actions
  - Local component state only (no persistence yet)

### 5) Public payment page
- `app/pay/[username]/page.tsx`
  - Public artisan profile view
  - Enter amount + purpose + name
  - Simulated payment processing and success state

### 6) Shared components
- `components/craft-score-gauge.tsx`
  - Animated SVG gauge with score color/label logic
- `components/stats-card.tsx`
  - Reusable metric cards with trend and icon
- `components/transaction-feed.tsx`
  - Transaction list renderer
- `components/payment-link-card.tsx`
  - QR, copy, WhatsApp share
- `components/virtual-card.tsx`
  - Stylized card UI with reveal/freeze behaviors

### 7) Data and utility layer
- `lib/mock-data.ts`
  - `mockArtisan`
  - `mockTransactions`
  - `mockScoreHistory`
  - `mockWeeklyIncome`
  - `mockScoreFactors`
- `lib/utils.ts`
  - class join helper `cn`
  - `formatNaira`
  - score color and label helpers

---

## G) Design system tokens (from globals.css)
Primary tokens include:
- Surfaces: `--bg`, `--surface`, `--surface-2`
- Borders: `--border`, `--border-light`
- Brand: `--orange`, `--orange-light`, `--purple`, `--purple-light`
- Semantic: `--green`, `--yellow`, `--red`
- Text: `--text-1` to `--text-4`
- Radius: `--radius-sm` ... `--radius-2xl`
- Fonts: `--font-syne`, `--font-dm-sans`, `--font-dm-mono`

Always preserve these style primitives and avoid introducing random new color systems unless requested.

---

## H) Current truth about auth and backend

### Current state
- No real auth provider wired.
- No user database schema wired in app code.
- No route guards/middleware for protected pages.
- Signed-in routes are currently accessible without a session.

### Therefore
This project is currently **MVP prototype mode** with mocked identity behavior.

---

## I) Recommended auth architecture (if implementing Supabase)

If real auth is required, use this phased path:

### Phase 1: Auth foundation
1. Add Supabase project + env vars
2. Create server/client supabase utilities
3. Add auth pages (`/auth/sign-in`, `/auth/sign-up`)
4. Replace landing Sign In/Get Started links to proper auth routes

### Phase 2: Protected routes
1. Add middleware for route protection on `/dashboard`, `/score`, `/loan`, `/card`
2. Redirect unauthenticated users to sign-in
3. Add sign-out action in sidebar

### Phase 3: Onboarding persistence
1. Add `profiles` table and onboarding fields
2. Save onboarding form to Supabase
3. Gate dashboard until onboarding complete

### Phase 4: Replace mocks progressively
1. Replace `mockArtisan` usage with profile/account query
2. Replace transaction mocks from backend table
3. Keep fallback skeleton/loading states

---

## J) Product semantics to preserve
- Keep distinction clear:
  - Sign In = returning existing artisan
  - Get Started = new artisan onboarding path
- Keep public payment page accessible without auth
- Keep dashboard experience rich but data-safe if auth is absent

---

## K) Known cleanup items
1. `app/dashboard/components/dashboard-nav.tsx` exists but appears unused.
2. Duplicate `formatNaira` in both `lib/mock-data.ts` and `lib/utils.ts`.
3. Extra nested path `my-app/app/(landing)` appears accidental.
4. `CLAUDE_HANDOFF_PROMPT.md` currently has title/content mismatch from previous edits.

---

## L) Security/operational caution
Do not include secrets/tokens/client credentials in commits or prompts.
If any were used in shell/testing, rotate them and move to environment variables.

---

## M) Immediate task instructions for DeepSeek
When continuing from this state:
1. First summarize architecture in your own words.
2. Then clarify whether auth should remain mocked or be implemented with Supabase now.
3. If implementing auth, start with minimal scaffolding and route protection.
4. Keep changes incremental, tested, and file-scoped.
5. Preserve UI style and current user journey semantics.

---

## N) What "done" means for future implementation
A proper production-ready interpretation would be:
- Sign In authenticates real user
- Get Started creates account then onboarding
- Onboarding stores profile and completion status
- Protected routes require session
- Sidebar supports sign out
- Public pay route remains public

---

## O) Additional precision: current UX intent map
- Landing: marketing + entry choices
- Onboarding: profile creation workflow
- Dashboard: daily business control center
- Score: trust/credit profile narrative
- Loan: offer conversion flow
- Card: spending instrument management
- Pay page: customer-facing money collection experience

---

## P) Final constraint
Prefer **surgical code changes** and avoid broad refactors unless explicitly requested.

## END MASTER PROMPT
