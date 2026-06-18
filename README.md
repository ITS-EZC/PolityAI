# PolityAI

**The public record, in plain English.**

![status](https://img.shields.io/badge/status-MVP%20prototype-BD7A2A)
![react](https://img.shields.io/badge/React-18-2D7A6B)
![ai](https://img.shields.io/badge/AI-Claude%20Sonnet%204.6-1F5B4F)
![license](https://img.shields.io/badge/license-MIT-555)

PolityAI takes the legislative record that is already public — bill text, voting records, roll calls — and makes it legible to a normal human being. It explains how your representatives vote in plain English, breaks down legislation anyone can actually understand, and alerts you when your rep votes on something you care about.

The data already exists on Congress.gov and the state legislature databases. It's just not built for people. This is the translation layer.

> **This repo is an MVP / proof-of-concept.** The **Bill Explainer is fully functional** and powered by live AI. Representatives, vote records, and tallies are **clearly-labeled sample data** — the wiring for real data sources is documented below under [Sample data vs. real data](#sample-data-vs-real-data).

---

## Table of contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Running it](#running-it)
- [The Bill Explainer contract](#the-bill-explainer-contract)
- [Sample data vs. real data](#sample-data-vs-real-data)
- [Design notes](#design-notes)
- [Accessibility](#accessibility)
- [Roadmap](#roadmap)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## What it does

The app has four sections, reachable from the top nav.

| Section | What it's for |
|---|---|
| **Your feed** | A personalized stream of recent votes filtered to the issues you follow. Toggle issue chips and the feed reshapes itself. |
| **Explain a bill** | The core feature. Pick a sample bill or paste any legislative text, hit **Translate to plain English**, and get a structured, nonpartisan breakdown. **This calls Claude live.** |
| **My representatives** | Enter an address or ZIP — no need to know your district — and see your officials, follow them, and read their recent votes with plain-English glosses. |
| **Alerts** | Pick the issues and representatives you follow; see a simulated alert feed of relevant votes, plus how real-time alerts would be delivered in production. |

### The Bill Explainer (the part that's real)

This is the whole thesis in one interaction. The bill's dense statutory text sits on the left; on the right, Claude returns a clean breakdown:

- **TL;DR** — one or two sentences a ninth-grader can follow
- **What it does** — the actual provisions, in plain bullets
- **Who it affects**
- **The case for** and **the case against** — presented fairly, side by side
- **Jargon, decoded** — legal/procedural terms mapped to plain meaning
- **Why this matters to you** — tied to the issues you selected

Every call runs through a strictly nonpartisan system prompt. The model is instructed to present multiple sides, never advocate, and ground every point in the text it was given.

---

## How it works

```
                    ┌─────────────────────────────────────────┐
                    │              PolityAI (React)            │
                    │                                          │
  user picks/pastes │   ┌──────────────┐     ┌──────────────┐  │
  a bill ──────────────▶│ Explainer UI │     │  Sample data │  │
                    │   └──────┬───────┘     │  reps/votes/ │  │
                    │          │             │  feed/alerts │  │
                    │          ▼             └──────────────┘  │
                    │   explainBill(text, interests)           │
                    └──────────┬───────────────────────────────┘
                               │  POST /v1/messages
                               ▼
                    ┌─────────────────────────────┐
                    │      Anthropic API          │
                    │   claude-sonnet-4-6         │
                    │   (nonpartisan system msg)  │
                    └──────────┬──────────────────┘
                               │  JSON breakdown
                               ▼
                       rendered as plain-English panels
```

The explainer asks the model to return **only JSON** with a fixed shape, strips any stray code fences, parses it, and renders each field into its own panel. If the call fails or the JSON is malformed, the UI shows a friendly error rather than breaking.

Everything else (feed, rep cards, vote rows, alerts) is computed from the in-memory `BILLS` and `REPS` arrays with `useMemo` — no backend, no database, no network calls.

---

## Tech stack

- **React 18** (`useState`, `useMemo`) — single functional component, default export
- **Anthropic Messages API** (`claude-sonnet-4-6`) for the live explainer
- **Self-contained CSS** injected via a `<style>` tag — no Tailwind, no CSS framework dependency
- **Google Fonts**: Fraunces (display), Inter (body/UI), Space Mono (bill IDs, tallies)
- **Zero build-time dependencies** beyond React itself — no component libraries

---

## Project structure

It's a single file, `PolityAI_MVP.jsx`, organized top to bottom:

```
PolityAI_MVP.jsx
├── C                      // color palette (hex tokens)
├── TOPICS                 // the six followable issue areas
├── REPS                   // 3 sample representatives  [SAMPLE DATA]
├── BILLS                  // 6 sample bills w/ source text, tally, votes  [SAMPLE DATA]
├── daysAgo()              // relative-time helper
├── explainBill()          // ← the live Claude call + JSON parsing
├── VoteBadge / Spinner / RepCard / VoteRow / Block   // small components
├── PolityAI (default export)   // app shell, state, the four tabs
└── CSS                    // the entire stylesheet as a template literal
```

State lives in the `PolityAI` component: `tab`, `interests`, `followed`, the explainer's `activeBill` / `pasted` / `usePasted` / `result` / `loading` / `err`, and the address field.

---

## Running it

### Option A — inside a Claude artifact (zero setup)

This MVP was built to run as a **claude.ai artifact**. In that environment the call to `api.anthropic.com` is authenticated for you — no API key, no headers, no proxy. Paste the file into an artifact and the explainer works immediately.

### Option B — run it locally with Vite

The component itself runs anywhere React does. The one thing that needs adapting is the API call: **you must not call the Anthropic API directly from the browser** outside the artifact runtime — it would expose your key and hit CORS. Put a tiny server in front of it.

**1. Scaffold and add the file**

```bash
npm create vite@latest polityai -- --template react
cd polityai
npm install
# drop PolityAI_MVP.jsx into src/ and render <PolityAI /> from main.jsx
```

**2. Add a minimal proxy** (`server.mjs`) that holds the key:

```js
import express from "express";
const app = express();
app.use(express.json());

app.post("/api/explain", async (req, res) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
});

app.listen(8787, () => console.log("proxy on :8787"));
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
node server.mjs
```

**3. Point the component at the proxy.** In `explainBill`, change the fetch target from `https://api.anthropic.com/v1/messages` to your proxy route (`/api/explain`) and drop the auth headers — the proxy adds them. Everything else in the function stays the same.

Get a key from the [Anthropic Console](https://console.anthropic.com). Current model names are listed in the [models docs](https://docs.claude.com/en/docs/about-claude/models); swap `claude-sonnet-4-6` for any current model.

---

## The Bill Explainer contract

`explainBill(billText, interests)` sends the bill text plus the reader's selected issues and asks for a strict JSON response. Anyone extending the explainer should preserve this shape.

**Request** (body sent to `/v1/messages`):

```json
{
  "model": "claude-sonnet-4-6",
  "max_tokens": 1000,
  "system": "You are PolityAI, a strictly nonpartisan civic explainer ... outputs only valid JSON.",
  "messages": [{ "role": "user", "content": "<bill text + interests + the schema below>" }]
}
```

**Expected response** (the model returns this as JSON; the client strips ```` ```json ```` fences before parsing):

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

The prompt enforces: nonpartisan and balanced, no advocacy, grounded in the provided text (no invented provisions), and each string kept short.

---

## Sample data vs. real data

To keep the prototype self-contained, three things are mocked and **labeled as a demo** in the UI footer and a badge in the header:

- `REPS` — three illustrative representatives (fictional names)
- `BILLS[].votes` and `BILLS[].tally` — illustrative roll-call results
- The address lookup — reveals the sample reps regardless of input

The bill `source` text is realistic statutory language written for demonstration. **The explainer's output is genuinely generated live** on whatever text it's given, so its value is real even on sample input.

To make it production-real, swap the mock arrays for these sources behind a small data layer:

| Need | Source |
|---|---|
| Federal bills, summaries, metadata | [Congress.gov API](https://api.congress.gov) (Library of Congress) |
| Roll-call votes | House Clerk + Senate roll-call records; the open [`@unitedstates/congress`](https://github.com/unitedstates/congress) datasets parse these |
| Address → your representatives | a geocoding/districting service |
| State legislatures (all 50) | [OpenStates / Plural](https://openstates.org) |

> Verify each source's current terms, rate limits, and availability during integration — don't assume uptime or licensing.

**A hard rule for production:** every summary must link back to its official source, and summaries must be grounded in retrieved text rather than model recall. A wrong fact about how a real person voted is the one bug this product cannot ship.

---

## Design notes

The look is deliberately **not** a government-website pastiche and **not** partisan. The brief is "public record, made human," so the palette borrows the verdigris patina of civic monuments — civic without being flag-coded.

| Token | Hex | Use |
|---|---|---|
| Ink | `#16202E` | text, avatars |
| Paper | `#F4F5F1` | background |
| Patina | `#2D7A6B` | primary accent |
| Amber | `#BD7A2A` | alerts / attention |
| Yea / Nay | `#2F7D6E` / `#B05B3D` | vote indicators — *intentionally not red/blue* |

**Type:** Fraunces (a warm humanist serif) for headlines, Inter for the interface, and Space Mono for bill numbers and tallies — because those genuinely are data, so mono encodes something true rather than decorating.

**Signature element:** the side-by-side translation in the explainer — dense statute on the left visibly becoming plain English on the right. It is the product thesis rendered as an interaction.

---

## Accessibility

Built in, not bolted on:

- Visible keyboard focus on inputs (`:focus` outlines)
- `prefers-reduced-motion` respected — the spinner and shimmer stop
- Vote state is never conveyed by color alone — every badge carries a text label
- Responsive down to mobile: the translation panes and two-column layouts stack under 820px

---

## Roadmap

Mapped to the PRD. Near-term first:

- [ ] Wire the explainer to the **Congress.gov API** so any real bill loads by number
- [ ] Real **representative lookup** by address
- [ ] **Source links** on every summary (non-negotiable for trust)
- [ ] **Email/push alerts** when a followed rep votes on a followed issue
- [ ] Faithfulness checks on generated summaries
- [ ] **All 50 state legislatures** via OpenStates
- [ ] Bill version diffs, in plain English
- [ ] Weekly digest

Deliberately deferred to avoid an "advocacy platform" perception: contacting reps, voter registration, any kind of scoring.

---

## Known limitations

- Sample reps/votes are illustrative, not real records (see above).
- The explainer depends on the model returning valid JSON; malformed output surfaces a friendly error and asks the user to retry.
- No persistence — follows and interests reset on reload (artifacts can't use browser storage).
- Single chamber's worth of demo data; no state or local coverage yet.

---

## Contributing

PolityAI is looking for a **technical co-founder** and contributors who care about civic access. If you're a developer who wants real-world impact, or you work in civic tech, policy, or democracy, open an issue or reach out. The highest-leverage first contribution is the real data layer.

---

## Disclaimer

PolityAI is **nonpartisan**. It explains legislation and voting records and presents multiple sides; it does not endorse positions, candidates, or parties. It is an information tool, not legal or voting advice. In this prototype, representatives and vote records are illustrative sample data.

---

## License

MIT recommended for an open civic tool — add a `LICENSE` file. (Apache-2.0 is also a reasonable choice if you want an explicit patent grant.)
