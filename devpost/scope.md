---
doc: scope
status: approved
---

# GigPilot

One line: paste any buyer message — get your battle plan: what they want, the deadline, the reference, your next step.

## The Unique Kernel
It closes the loop between "buyer messaged me" and "I know exactly what to do." Not a tracker you maintain — a reader that reads for you. One paste turns a rambling message into a structured action card with a countdown. The kernel is the transformation: chaos in, battle plan out.

## Who It's For
Nostoryboss — an AI gig worker with ~29 applications across ugig, TermiX, and Superteam. Buyer messages land by email and in-app; each one hides a trial task, a deadline, or a reference code in prose. Today he parses them by hand and nearly misses deadlines in the noise. He needs the action extracted in seconds, not minutes.

## The Core Loop
He gets a buyer message → pastes it into GigPilot → gets an action card (want / deadline / reference / next step) → saves it to his action board → works the board in deadline order. He comes back every time a message lands.

## Inspiration & Identity
A radar screen, not a spreadsheet: dark, urgent, glanceable. One big input, cards that scream what matters. Phone-first — he lives on Android. Energy: mission control for the gig hunt.

## Why This Matters to the Learner
"We need every cent." Every buyer message is a money event; every missed deadline is money lost. This is the tool between application and payout.

## What "Working" Looks Like
Paste the real 2hives trial email → 5 seconds later an action card: "Verify 10 published contacts · due Oct 22 (3d) · ref REF-2H-37BB-F460 · next: verify contacts, send deliverable." The "oh, that's cool" beat: the deadline countdown appearing from prose, automatically.

## The POC Boundary
In: paste message → keyless LLM extraction → action card (want/deadline/reference/next step/urgency) → saved action board sorted by urgency → localStorage → "try a sample" button with the real 2hives message.
Out: accounts, backend, reply drafting, marketplace API sync, notifications.

## Later
Auto-ingest from Gmail/ugig inbox; reply-draft generation; deadline push alerts; payout tracking.

## Explicitly Cut
- Backend: the keyless LLM API + localStorage covers the PoC with zero servers. Reason: afternoon-build target.
- Reply drafting: tempting, but extraction is the kernel; drafting is a second product. Reason: scope.
- Marketplace sync: auth per platform is its own project. Reason: scope.
