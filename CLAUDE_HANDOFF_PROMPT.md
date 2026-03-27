# Deepseek Handoff Prompt (CraftID)

Copy everything in this file (or from `BEGIN HANDOFF` to `END HANDOFF`) into Claude in the browser.

---

## BEGIN HANDOFF

You are helping continue development of an existing Next.js app called **CraftID**.

### 1) Project context and goal
CraftID is an MVP fintech-style product for Nigerian artisans. The concept is:
- Artisans collect client payments through a payment link / QR code.
- Transaction behavior builds a **CraftScore**.
- CraftScore unlocks products (nano loan, virtual card, business banking progression).

The current app is mostly frontend/UI prototype with mocked data and polished animations.

### 2) Tech stack
- Next.js App Router (`next@16.2.1`)
- React 19
- TypeScript (strict)
- Tailwind CSS v4 + custom CSS variables
- Framer Motion for animations
- Lucide React for icons
- Recharts for charts
- `qrcode.react` for QR generation

### 3) Critical agent instruction from repo
There is a local instruction in `AGENTS.md`:
- This Next.js version may differ from old training assumptions.
- Check docs under `node_modules/next/dist/docs/` when framework behavior is unclear.

### 4) Key scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### 5) Current file/folder structure (core)
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

package.json
next.config.ts
tsconfig.json
AGENTS.md
CLAUDE.md
```

Note: there is also an extra nested folder `my-app/app/(landing)` under repo root that looks accidental/unused.

### 6) Routing and UX map
- `/` → landing marketing page (via route group `(landing)`)
- `/dashboard` → signed-in dashboard overview
- `/score` → CraftScore details + unlock tiers
- `/loan` → loan offer flow (adjust amount + accept)
- `/card` → virtual card view/actions
- `/onboarding` → multi-step onboarding/identity/profile setup
- `/pay/[username]` → public payment page for artisan profile

### 7) New shared signed-in navigation architecture (important)
A shared authenticated wrapper was introduced:
- `components/authenticated-layout.tsx` includes:
  - `NavSidebar` (desktop left sidebar + mobile bottom nav)
  - a common `<main>` with consistent signed-in spacing

Applied to route layouts:
- `app/dashboard/layout.tsx`
- `app/score/layout.tsx`
- `app/loan/layout.tsx`
- `app/card/layout.tsx`

`components/nav-sidebar.tsx` now provides:
- Desktop sidebar links: Dashboard, Score, Loan, Card, Settings(onboarding)
- Mobile fixed bottom navbar with same route set

### 8) Design system and style primitives
Global CSS in `app/globals.css` defines core tokens:
- Surfaces: `--bg`, `--surface`, `--surface-2`
- Borders: `--border`, `--border-light`
- Brand colors: `--orange`, `--purple`, plus dim variants
- Semantic colors: `--green`, `--yellow`, `--red`
- Text shades: `--text-1`..`--text-4`
- Radius scale: `--radius-sm`..`--radius-2xl`
- Fonts set via `next/font/google` in `app/layout.tsx`: Syne, DM Sans, DM Mono

### 9) Data model (mocked)
Primary mocked data in `lib/mock-data.ts`:
- `mockArtisan` (identity, city, craft score, earnings, loan offer, card, rate card)
- `mockTransactions`
- `mockScoreHistory` (generated 60-day curve)
- `mockWeeklyIncome`
- `mockScoreFactors`

Utility helpers:
- `lib/utils.ts`: `formatNaira`, score color/label helpers, simple `cn` util
- There is also a duplicate `formatNaira` exported in `mock-data.ts`

### 10) Key feature components
- `craft-score-gauge.tsx` → animated SVG score arc with color bands/label
- `stats-card.tsx` → reusable KPI card with trend icon/meta
- `transaction-feed.tsx` → animated payment list rows
- `payment-link-card.tsx` → QR + copy link + WhatsApp share
- `virtual-card.tsx` → stylized virtual card, reveal last4, limit/available

### 11) Current app behavior summary
- Landing page is complete visually with sections and CTA.
- Signed-in routes have unified nav shell for easier movement across pages.
- Dashboard, score, loan, card are connected by shared navigation.
- Public pay flow and onboarding are functional mocked UX flows.
- No backend/API integration yet; everything is static/mock client UI.

### 12) Known technical notes / cleanup opportunities
Potential follow-up cleanup tasks:
1. Standardize `formatNaira` (single source in `lib/utils.ts`).
2. Remove/confirm unused `app/dashboard/components/dashboard-nav.tsx` (not currently wired to pages).
3. Decide if `/onboarding` should also live inside authenticated layout (currently standalone page, not layout-wrapped).
4. Investigate accidental nested folder: `my-app/app/(landing)`.
5. Address Tailwind lint suggestions where arbitrary classes can be replaced by canonical utility forms.
6. Confirm favicon strategy (`app/favicon.ico` was removed and `app/icon.svg` exists).

### 13) Current product direction and constraints
Please preserve these constraints while continuing development:
- Keep the visual theme (dark fintech aesthetic with orange/purple accents).
- Keep existing UX flows and route structure; avoid unnecessary route churn.
- Prefer minimal, surgical changes instead of broad refactors.
- Maintain TypeScript strictness and App Router conventions.

### 14) What I want you (Claude) to do next
1. First, read and summarize the existing architecture in your own words.
2. Then propose a prioritized next-step plan with effort estimates.
3. Then implement incrementally (one coherent slice at a time), validating after each slice.
4. Keep updates concise and always mention which files changed.

### 15) If you need to run locally
Use:
```bash
npm install
npm run dev
```

### 16) Additional config details
- `next.config.ts` includes `allowedDevOrigins` with one LAN IP.
- `tsconfig.json` uses strict mode and `@/*` path alias.

## END HANDOFF

---

If you want, I can also generate a second handoff variant specifically optimized for “Claude Code” style execution prompts (with step-by-step coding tasks and acceptance criteria).