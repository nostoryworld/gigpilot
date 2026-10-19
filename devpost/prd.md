---
doc: prd
status: approved
---

# GigPilot — Product Requirements

One line: paste any buyer message — get your battle plan: what they want, the deadline, the reference, your next step. For Nostoryboss, an AI gig worker who parses buyer messages by hand across 3 platforms.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey
1. He opens GigPilot on his phone. One big textarea: "Paste a buyer message…", a "Try a sample" link, an Analyze button.
2. He pastes the 2hives trial email, taps Analyze. A spinner runs ~5–15s (keyless LLM call).
3. An action card appears: what they want, deadline with live countdown ("due in 3d"), reference code, the single next step, urgency badge.
4. He taps Save — the card joins his action board below, sorted by urgency then deadline.
5. Success: in under 30 seconds a rambling message becomes a dated, referenced action he can't lose.

## Screens and Layout
Single screen:
- **Header**: app name, count of open actions.
- **Input zone**: textarea, "Try a sample" link, Analyze button. Collapses after analysis to keep the board visible.
- **Result card** (appears after analysis): urgency badge (high=red, medium=amber, low=green), "want" as the title, deadline + countdown, reference chip (tap to copy), next step, Save / Discard buttons.
- **Action board**: saved cards, sorted high→low urgency then earliest deadline. Each shows want, countdown, reference chip, next step, delete button. Empty state: one line.

## Look and Feel
Dark mission-control theme: bg `#0d1117`-ish, cards `#161d27`, red/amber/green urgency coding. Big touch targets, system fonts, tabular numbers on countdowns. No onboarding tour. Feels urgent and competent.

## Features and Behavior

### Analysis
- POSTs the message to `https://text.pollinations.ai/openai` (keyless, OpenAI-compatible) with a system prompt demanding ONLY a JSON object: `{want, deadline (YYYY-MM-DD|null), reference (string|null), next_step, urgency (high|medium|low)}`.
- Parses the JSON from the response content (strip markdown fences if present). On parse failure or network error: show a clear error with Retry — never show a fake card.
- "Try a sample" fills the real (redacted) 2hives trial message so anyone can see it work instantly.

### Action board
- Save stores `{id, want, deadline, reference, next_step, urgency, source (first 120 chars of message), createdAt}` in localStorage under `gigpilot.v1`.
- Sorted: high urgency first, then earliest deadline (null deadlines last).
- Countdown: "due in 3d" / "due tomorrow" / "due today" / "overdue 2d" (red). No deadline → "no deadline".
- Reference chip: tap to copy to clipboard.
- Delete per card with confirm. "New analysis" button resets the input.

### Honesty rules (demo-critical)
- Never invent a card: every field comes from the LLM JSON or is null.
- The sample message is labeled as a sample.
- Footer notes the extractor is AI and to double-check deadlines.

## Out of Scope
Accounts, backend, reply drafting, marketplace sync, notifications.

## Acceptance
- Paste sample → card with correct deadline (2026-10-22), reference (REF-2H-37BB-F460), urgency high.
- Save → persists across reload, sorted correctly.
- Airplane-mode (fetch fails) → clean error, no fake card.
- Whole flow demoable in under 90 seconds.
