---
doc: spec
status: approved
---

# GigPilot — Technical Spec

Source: `prd.md` (all sections). POC boundary: `scope.md > The POC Boundary`.

## Architecture
Single static web app: `index.html` + `styles.css` + `app.js`. No build step, no dependencies, no backend. The only network call is the browser's `fetch` to the keyless LLM endpoint. Runs from `file://` or any static host; deployed to Cloudflare Workers for the public demo URL.

## LLM Extraction
- Endpoint: `POST https://text.pollinations.ai/openai`, body `{model: "openai", messages: [...]}` (OpenAI-compatible, keyless).
- System prompt: "You extract action items from buyer messages for a freelance gig worker. Reply with ONLY a JSON object, no other text. Schema: {\"want\": \"one-line: what the buyer wants\", \"deadline\": \"YYYY-MM-DD or null\", \"reference\": \"reference code or null\", \"next_step\": \"one-line: the single next action\", \"urgency\": \"high|medium|low\"}. Today is 2026-10-19."
- Response parsing: take `choices[0].message.content`, strip ```json fences, `JSON.parse`. Validate required keys; `deadline` must match `/^\d{4}-\d{2}-\d{2}$/` or be null; `urgency` in {high, medium, low} else default "medium".
- Failure modes: network error / non-200 / parse failure → show error box with Retry button. Never render a card from failed data.

## Data Model
```js
// localStorage "gigpilot.v1" -> { actions: Action[] }
Action = {
  id: string,           // crypto.randomUUID()
  want: string,
  deadline: string|null, // YYYY-MM-DD
  reference: string|null,
  next_step: string,
  urgency: "high"|"medium"|"low",
  source: string,        // first 120 chars of the analyzed message
  createdAt: number
}
```

## Key Behaviors
- `analyze()`: disable button, show spinner, fetch, parse, render result card or error.
- `saveAction()`: push to state, persist, re-render board, collapse input.
- Board sort: urgency weight (high 0, medium 1, low 2), then deadline ascending (nulls last), then createdAt descending.
- Countdown via `daysUntil()`; classes: `.u-high` red badge, `.u-medium` amber, `.u-low` green; overdue countdown red.
- Copy reference: `navigator.clipboard.writeText` with fallback.
- Sample message: constant `SAMPLE_MESSAGE` (redacted 2hives trial text).

## Look and Feel (implementable)
- bg `#0d1117`, surface `#161d27`, border `#2a3444`, text `#e8edf3`, muted `#8b98ab`; urgency red `#ef4444` / amber `#f59e0b` / green `#22c55e`; accent `#38bdf8`.
- Header sticky; input zone prominent; cards with left urgency border; big Analyze button; system font stack.

## Files
- `index.html`, `styles.css`, `app.js` (~250 lines), `devpost/scope.md`, `devpost/prd.md`, `devpost/spec.md`, `README.md`, `.gitignore` (excludes `devpost/learner-profile.md`).

## Testing (manual)
1. "Try a sample" → Analyze → card shows want/deadline 2026-10-22/ref/urgency high. 2. Save → reload → persists, sorted. 3. Paste gibberish → sensible card or clean nulls. 4. Offline (block domain) → error + retry, no fake card. 5. Delete → confirm → gone.
