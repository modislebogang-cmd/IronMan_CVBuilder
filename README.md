# IronMan_ResumeBuilder

AI resume builder web app — React + Vite front end, Node/Express API, Iron Man
colour palette (hot-rod red, gold, cyan reactor glow on gunmetal black) and a
hand-built **3D Iron Man helmet logo**.

## Quick start

```bash
npm install
npm run dev          # API on :8787 + Vite on :5173, both watched
```

Open <http://localhost:5173>.

Production:

```bash
npm run build        # type-check + bundle into dist/
npm start            # Express serves dist/ AND the API on :8787
```

> In dev the Vite proxy forwards `/api` to `:8787`, so there is no CORS setup.

## What is implemented

| Requirement | Where |
| --- | --- |
| Register / login (JWT + bcrypt, autosave, route guard) | `server/index.js`, `src/context/AuthContext.tsx`, `src/pages/{Login,Register}.tsx` |
| Buy credits — Free **R0** / Pro **R100** (interface only) | `src/pages/Pricing.tsx`, `POST /api/billing/purchase` |
| Bottom menu | `src/components/BottomNav.tsx` (Home · Builder · Pricing · Account) |
| Name + 3D Iron Man logo | `src/components/IronManLogo.tsx` (CSS 3D, auto-rotating, draggable) |
| Resume builder + live preview + print/PDF export + AI | `src/pages/Builder.tsx`, `server/ai.js` |

### Plan model

| | Free — R0 | Pro — R100 (once) |
| --- | --- | --- |
| Resume drafts | 1 | Unlimited |
| Live preview / PDF | Yes | Yes |
| AI generations | ✗ (server returns `402 UPGRADE_REQUIRED`) | 20 credits |
| Recruiter suggestions | ✗ | Yes |

The checkout form validates card shape only (16 digits, `MM/YY`, 3–4 digit
CVV); **no card details are stored** and no money moves. A payment record with
the last 4 digits is written to `server/data/db.json` and shown under Account.

### AI provider

Default is an offline, deterministic resume writer (`server/ai.js`) so the app
works with zero keys. To use a real LLM with the same interface:

```bash
$env:AI_PROVIDER="openai"; $env:OPENAI_API_KEY="sk-…"; $env:OPENAI_MODEL="gpt-4o-mini"
```

If the API call fails it silently falls back to the offline draft.

### Environment variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8787` | API port |
| `JWT_SECRET` | dev placeholder | **Set this in production.** |
| `AI_PROVIDER` / `OPENAI_API_KEY` | off | Optional real LLM |

## Tests

`qa-smoke.mjs` is a headless end-to-end run (needs both servers up, i.e.
`npm run dev`):

```bash
node <browser-automation-skill-dir>/browser.mjs http://localhost:5173 --script ./qa-smoke.mjs
```

It registers an account, edits a resume, checks autosave, verifies the free
plan is blocked from AI, buys Pro, generates with AI, checks the receipt,
navigates the bottom menu, verifies the auth guard and the wrong-password
message, and reports runtime errors (wrong-password 401s excluded on purpose).

## Errors found by testing, and where they were fixed

1. **Login rejected valid wrong-password attempts with a misleading 400.**
   Login reused the registration schema (min-8 password + required name).
   Fixed in `server/index.js` → `POST /api/auth/login` (dedicated login schema).
2. **`/api/resume/generate` accepted unknown body keys and could persist them.**
   Added a strict schema + validation in `server/index.js` → `generate`.
3. **Unknown `/api/*` routes could fall through to the error handler.**
   Rewritten as a plain middleware in `server/index.js` (catch-all).
4. **3D logo rendered as a flat sliver.** Panels were laid out in a stage with
   no font-size, so every `em`-based size collapsed to ~2.5px. Fixed in
   `src/styles.css` → `.logo-stage { font-size: var(--logo-size) }` plus a
   unit-sized stage.
5. **Initial logo pose was never applied** (the rotate values were only set
   inside an effect that exits early). Fixed in `src/components/IronManLogo.tsx`
   with an explicit `apply()` on mount.
6. **Builder re-saved on first load and could fight server state.**
   Autosave now only runs after a real edit (`dirty` ref) and the resume is
   initialised once from the user (`src/pages/Builder.tsx`).
7. **React StrictMode double-mount registered duplicate listeners** on the logo
   drag; the handlers now attach/remove on the same call.
8. **Production deep links (e.g. `/pricing`) 404'd** — Express SPA fallback
   added (`server/index.js`), verified against `dist/`.
9. **Favicon still pointed at the Vite starter art** — replaced with the
   Iron Man helmet mark (`public/favicon.svg`).
10. **Starter template leftovers** (`src/main.ts`, `counter.ts`, Vite hero
    assets, `public/icons.svg`) removed; `tsconfig.json` now has `jsx`,
    `strict` and DOM.Iterable.

## Recommended options (my picks)

| Concern | Recommended | Why / alternative |
| --- | --- | --- |
| Framework | **React 19 + Vite + TypeScript** (used) | Fast HMR, typed API contracts. Next.js only if you need SEO/SSR marketing pages. |
| API | **Express 5 + Zod** (used) | Minimal, well-known. Swap to Fastify if you need throughput; NestJS if the team is large. |
| Database | **SQLite + Drizzle ORM** for dev, **PostgreSQL** (Neon/Supabase) for production | `server/store.js` is the only file to replace — it already isolates all persistence. |
| Auth | Start with **JWT + bcrypt** (used); move to **Auth.js / Clerk / Supabase Auth** | Adds OAuth (Google/LinkedIn), email verification, and password reset for free. |
| Payments (real) | **Paystack or YooPay** for ZAR + card/EFT, or **Stripe** | Paystack is the usual South African choice and supports ZAR settlements. Keep the purchase endpoint but replace the simulated authorisation with a webhook-verified charge. |
| AI | **OpenAI `gpt-4o-mini`** (cheap, good writing) or **Anthropic Claude Haiku**; Gemini Flash as a budget option | Keep the provider interface in `server/ai.js`; offline fallback stays as a safety net. |
| PDF export | **Print-to-PDF** (used, zero deps) → upgrade to **`@react-pdf/renderer`** | Server-generated PDFs are consistent across browsers and let you gate by plan. |
| 3D logo | **CSS 3D** (used, no deps) → **react-three-fiber + GlbModel** | Only go WebGL if you want a true modelled helmet; it costs ~150 KB gzip. |
| UI | Plain CSS design tokens (used) → **Tailwind + shadcn/ui** | Faster iteration on forms once the design is locked. |
| Hosting | Frontend + API on **Render / Railway / Fly.io**, DB on **Neon** | `npm start` already serves both from one process. |

## Project structure

```
server/         Express API (auth, resume, billing, AI) + JSON store
src/components/ IronManLogo (3D), BottomNav, TopBar, ResumePreview, Icons
src/context/    AuthContext (session, credits, purchase, AI)
src/pages/      Landing, Login, Register, Builder, Pricing, Account
src/lib/api.ts  fetch wrapper with typed errors
src/styles.css  Iron Man theme, 3D logo geometry, print styles
```
