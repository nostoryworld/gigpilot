// GigPilot — paste a buyer message, get your battle plan.
// Keyless LLM extraction (Pollinations, OpenAI-compatible) + localStorage board.

const STORE_KEY = "gigpilot.v1";
const LLM_URL = "https://text.pollinations.ai/openai";
const TODAY = "2026-10-19";

const SAMPLE_MESSAGE = `Hi, thanks for applying to our paid work packages.

Trial task: verify 10 published contacts using public sources only. Do not contact anyone.

Task reference: REF-2H-37BB-F460 — put this reference in your reply.
Deadline: 2026-10-22.
Reply to info@2hives.com with your deliverable in the specified format.`;

const SYSTEM_PROMPT = `You extract action items from buyer messages for a freelance gig worker. Reply with ONLY a JSON object, no other text, no markdown fences. Schema: {"want": "one-line: what the buyer wants", "deadline": "YYYY-MM-DD or null", "reference": "reference code or null", "next_step": "one-line: the single next action", "urgency": "high|medium|low"}. Today is ${TODAY}. If no clear deadline, use null. Urgency high = due within 3 days or money on the line.`;

let state = { actions: [] };
let pendingAction = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[m]));

// ---------- persistence ----------
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) { state = { actions: [] }; }
}

// ---------- countdown ----------
function daysUntil(iso) {
  if (!iso) return null;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((new Date(iso + "T00:00:00") - t) / 86400000);
}
function countdown(iso) {
  const n = daysUntil(iso);
  if (n === null) return { text: "no deadline", cls: "" };
  if (n < 0) return { text: `${-n}d overdue`, cls: "over" };
  if (n === 0) return { text: "due today", cls: "hot" };
  if (n === 1) return { text: "due tomorrow", cls: "hot" };
  if (n <= 3) return { text: `due in ${n}d`, cls: "hot" };
  return { text: `due in ${n}d`, cls: "" };
}

// ---------- LLM extraction ----------
async function analyze(message) {
  const res = await fetch(LLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message.slice(0, 4000) }
      ]
    })
  });
  if (!res.ok) throw new Error(`Extractor returned ${res.status}`);
  const data = await res.json();
  let text = data.choices?.[0]?.message?.content || "";
  text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(text);
  return {
    want: String(parsed.want || "Unclear — re-read the message").slice(0, 200),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(parsed.deadline || "") ? parsed.deadline : null,
    reference: parsed.reference ? String(parsed.reference).slice(0, 60) : null,
    next_step: String(parsed.next_step || "Follow up with the buyer").slice(0, 200),
    urgency: ["high", "medium", "low"].includes(parsed.urgency) ? parsed.urgency : "medium"
  };
}

// ---------- render ----------
function cardHTML(a, showSource) {
  const cd = countdown(a.deadline);
  return `
  <div class="action-card u-${a.urgency}">
    <div class="card-top">
      <span class="badge">${a.urgency}</span>
      <span class="countdown ${cd.cls}">⏰ ${esc(cd.text)}</span>
    </div>
    <div class="want">${esc(a.want)}</div>
    ${a.reference ? `<div class="kv"><span class="k">Reference</span><span class="ref-chip" data-ref="${esc(a.reference)}" title="tap to copy">${esc(a.reference)}</span></div>` : ""}
    ${a.deadline ? `<div class="kv"><span class="k">Deadline</span><span>${esc(a.deadline)}</span></div>` : ""}
    <div class="next-step"><span class="k">👉 Next:</span> ${esc(a.next_step)}</div>
    ${showSource && a.source ? `<div class="source">from: “${esc(a.source)}…”</div>` : ""}
  </div>`;
}

function renderResult() {
  if (!pendingAction) { $("resultZone").classList.add("hidden"); return; }
  $("resultCard").innerHTML = cardHTML(pendingAction, false);
  $("resultZone").classList.remove("hidden");
  $("inputZone").classList.add("hidden");
  $("newBtn").classList.remove("hidden");
  wireRefChips($("resultCard"));
}

function renderBoard() {
  const board = $("board");
  const sorted = [...state.actions].sort((a, b) => {
    const w = { high: 0, medium: 1, low: 2 };
    if (w[a.urgency] !== w[b.urgency]) return w[a.urgency] - w[b.urgency];
    if ((a.deadline || "9999") !== (b.deadline || "9999"))
      return (a.deadline || "9999") < (b.deadline || "9999") ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
  $("openCount").textContent = sorted.length;
  if (!sorted.length) {
    board.innerHTML = `<div class="empty">No actions yet. Paste your first buyer message above.</div>`;
    return;
  }
  board.innerHTML = "";
  for (const a of sorted) {
    const wrap = document.createElement("div");
    wrap.innerHTML = cardHTML(a, true);
    const del = document.createElement("button");
    del.className = "card-delete";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      if (confirm("Delete this action?")) {
        state.actions = state.actions.filter((x) => x.id !== a.id);
        save(); renderBoard();
      }
    });
    wrap.firstElementChild.appendChild(del);
    board.appendChild(wrap);
  }
  wireRefChips(board);
}

function wireRefChips(root) {
  root.querySelectorAll(".ref-chip").forEach((chip) => {
    chip.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(chip.dataset.ref); }
      catch (e) {
        const ta = document.createElement("textarea");
        ta.value = chip.dataset.ref; document.body.appendChild(ta);
        ta.select(); document.execCommand("copy"); ta.remove();
      }
      const orig = chip.textContent;
      chip.textContent = "copied ✓";
      setTimeout(() => { chip.textContent = orig; }, 1200);
    });
  });
}

// ---------- actions ----------
function showError(msg) {
  const box = $("errorBox");
  box.innerHTML = `${esc(msg)}<br><button id="retryBtn" class="secondary">Retry</button>`;
  box.classList.remove("hidden");
  $("retryBtn").addEventListener("click", onAnalyze);
}
function hideError() { $("errorBox").classList.add("hidden"); }

async function onAnalyze() {
  const message = $("msgInput").value.trim();
  if (message.length < 20) {
    showError("Paste a buyer message first — a sentence or two at least.");
    return;
  }
  hideError();
  const btn = $("analyzeBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>Reading…`;
  try {
    const extracted = await analyze(message);
    pendingAction = {
      id: crypto.randomUUID(),
      ...extracted,
      source: message.slice(0, 120),
      createdAt: Date.now()
    };
    renderResult();
  } catch (e) {
    console.error(e);
    showError("Couldn't reach the extractor. Check your connection and try again — nothing was saved.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Analyze ⚡";
  }
}

function onSave() {
  if (!pendingAction) return;
  state.actions.push(pendingAction);
  pendingAction = null;
  save(); renderBoard();
  resetInput();
}
function onDiscard() { pendingAction = null; resetInput(); }
function resetInput() {
  $("resultZone").classList.add("hidden");
  $("inputZone").classList.remove("hidden");
  $("msgInput").value = "";
  hideError();
}

// ---------- wire up ----------
$("analyzeBtn").addEventListener("click", onAnalyze);
$("saveBtn").addEventListener("click", onSave);
$("discardBtn").addEventListener("click", onDiscard);
$("newBtn").addEventListener("click", resetInput);
$("sampleBtn").addEventListener("click", () => {
  $("msgInput").value = SAMPLE_MESSAGE;
  hideError();
});

load();
renderBoard();
