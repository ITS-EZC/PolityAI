# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

PolityAI is an MVP/proof-of-concept, not a buildable application. There is **no build tool, test suite, or linter** — don't invent `npm run` commands beyond what's below. The repo is two independent, unconnected front-end files, plus one small serverless backend:

- **`index.jsx`** — the actual product MVP: a single React component (`export default function PolityAI()`) with a live Anthropic API call. This is the file that matters for feature work.
- **`index.html`** — a static marketing/landing page (vanilla JS in an IIFE, CSS in a `<style>` tag). It has its own hardcoded demo bill data that is **separate from and inconsistent with** the `BILLS` array in `index.jsx` (different shape, different sample bills). Treat the two files as unrelated; there is no shared state or build step linking them.
- **`api/waitlist.js`** — a Vercel serverless function backing the early-access signup form in `index.html`. Writes to a Supabase Postgres `waitlist` table using the service-role key (server-side only, never exposed to the browser). `package.json`'s one dependency (`@supabase/supabase-js`) exists solely for this function. See "Waitlist backend" below for the schema and required env vars.

Since there's no bundler in-repo, `index.jsx` isn't meant to be run directly from this checkout. It was built to run in one of two ways (see README "Running it" for full detail):

1. **Pasted into a claude.ai artifact** — the Anthropic API call in `explainBill()` works with no key/headers because the artifact runtime authenticates it.
2. **Dropped into a scaffolded Vite/React app**, with a small server-side proxy in front of the Anthropic call (the API must never be called directly from a browser outside the artifact runtime — it would leak the key and hit CORS).

There is no dev server, build, lint, or test command to run in this repo as it stands. If asked to make the app runnable locally, you'll need to scaffold the tooling yourself (see README's Vite instructions) rather than looking for an existing script.

## Architecture of `index.jsx`

Organized top to bottom as one file:

- `C` — color palette (hex tokens used inline and injected into the `CSS` template literal)
- `TOPICS` — the six followable issue areas
- `REPS`, `BILLS` — **sample/mock data only**, explicitly labeled as such in-app (footer + header badge). `BILLS[].source` is realistic statutory text; `BILLS[].votes`/`tally` and all of `REPS` are fictional.
- `daysAgo()` — relative-time helper
- `explainBill(billText, interests)` — the one live/real feature. POSTs to `https://api.anthropic.com/v1/messages` with a strict nonpartisan system prompt, asks the model for JSON-only output, strips stray ` ```json ` fences, and `JSON.parse`s the result. **Preserve this request/response contract** (see below) if extending the explainer.
- `VoteBadge` / `Spinner` / `RepCard` / `VoteRow` / `Block` — small presentational components
- `PolityAI` (default export) — app shell: tab state (`feed` / `explain` / `reps` / `alerts`), `interests`, `followed`, and the explainer's own state (`activeBill`, `pasted`, `usePasted`, `result`, `loading`, `err`). `feedBills` and `alertBills` are `useMemo`-derived filters over `BILLS`.
- `CSS` — the entire stylesheet as a template literal, interpolating `C` tokens, injected via `<style>{CSS}</style>` in the render tree

Everything except the explainer is computed client-side from the in-memory `BILLS`/`REPS` arrays — no backend, no database, no persistence (state resets on reload).

### The Bill Explainer contract

`explainBill` sends `{ model: "claude-sonnet-4-6", max_tokens: 1000, system: <nonpartisan instruction>, messages: [...] }` and expects back JSON of exactly this shape:

```json
{
  "tldr": "string",
  "whatItDoes": ["string", "..."],
  "whoIsAffected": ["string", "..."],
  "argumentsFor": ["string", "..."],
  "argumentsAgainst": ["string", "..."],
  "jargonBuster": [{ "term": "string", "plain": "string" }],
  "relevanceToYou": "string | null"
}
```

The prompt enforces: strictly nonpartisan/balanced, no advocacy, grounded only in the given bill text (no invented provisions), short strings. If the model call fails or returns malformed JSON, the UI must show a friendly inline error (`pa-error`) rather than throw — don't remove that try/catch.

## Sample data vs. real data

`REPS`, `BILLS[].votes`/`tally`, and the address lookup are mocked and clearly labeled as demo data in the UI. Only the explainer's *output* is genuinely generated live — on whatever text it's given, including pasted text. When extending toward "real" data, the intended sources (per README) are:

| Need | Source |
|---|---|
| Federal bills, summaries, metadata | Congress.gov API |
| Roll-call votes | House Clerk / Senate roll-call records, or `@unitedstates/congress` datasets |
| Address → representatives | a geocoding/districting service |
| State legislatures | OpenStates / Plural |

The one hard rule carried over from the README: **every summary must eventually link back to its official source, and summaries must be grounded in retrieved text, not model recall** — a wrong fact about how a real person voted is treated as the one unshippable bug.

## Waitlist backend

`index.html`'s "Request access" form (`#signup`) POSTs `{ email }` to `/api/waitlist`, which is the only server-side code in this repo. It requires a Supabase project with:

```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  converted_to_user boolean not null default false
);
```

`converted_to_user` is there for when the real app ships — flip it (or run a migration script) when turning waitlist rows into real accounts. No such conversion script exists yet; don't build one until there's an actual user/auth system to migrate into.

Deploying via Vercel needs two env vars set in the project dashboard (not committed anywhere): `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The function treats a duplicate email (unique-constraint violation, Postgres code `23505`) as a success rather than an error, so re-submitting doesn't look broken to the user.

## Design notes worth preserving

- Vote/yea-nay indicators are intentionally **not** red/blue-coded (civic-neutral palette: patina green for yea, rust/amber for nay) and vote state is never conveyed by color alone — every badge carries a text label.
- `prefers-reduced-motion` is respected in both files (spinner/shimmer in `index.jsx`, scroll-reveal/marquee/pulse animations in `index.html`).
- Deliberately out of scope per the roadmap (to avoid an "advocacy platform" perception): contacting reps, voter registration, any kind of political scoring.
