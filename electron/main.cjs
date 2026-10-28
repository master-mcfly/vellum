const { app, BrowserWindow, ipcMain, safeStorage } = require("electron");
const fs = require("fs");
const path = require("path");

function keyFile() {
  return path.join(app.getPath("userData"), "xai-key.bin");
}

function readKey() {
  try {
    const buf = fs.readFileSync(keyFile());
    if (safeStorage.isEncryptionAvailable()) return safeStorage.decryptString(buf).trim();
    return buf.toString("utf8").trim();
  } catch {
    return (process.env.XAI_API_KEY || "").trim();
  }
}

function writeKey(value) {
  const file = keyFile();
  if (!value) {
    try {
      fs.unlinkSync(file);
    } catch {
      /* already gone */
    }
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(value)
    : Buffer.from(value, "utf8");
  fs.writeFileSync(file, payload);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "Vellum",
    backgroundColor: "#f6f1e7",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

function selectContext(question, paragraphs) {
  const broad = /summar|overview|what is this|main point|about this/i.test(question);
  if (broad) return paragraphs.slice(0, 12);
  const terms = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2);
  const ranked = [...paragraphs].sort((a, b) => score(b.text, terms) - score(a.text, terms));
  const keep = new Set(ranked.slice(0, 6).map((paragraph) => paragraph.id));
  const picked = paragraphs.filter((paragraph) => keep.has(paragraph.id));
  return picked.length ? picked : paragraphs.slice(0, 4);
}

function score(text, terms) {
  const hay = text.toLowerCase();
  return terms.reduce((total, term) => (hay.includes(term) ? total + 2 : total), 0);
}

function parseModel(text, allowed) {
  const trimmed = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const value = JSON.parse(trimmed);
    if (!value || typeof value.answer !== "string" || !value.answer.trim()) return null;
    const citations = Array.isArray(value.citations)
      ? value.citations.filter((id) => typeof id === "string" && allowed.has(id))
      : [];
    return { answer: value.answer.trim(), citations };
  } catch {
    return null;
  }
}

ipcMain.handle("vellum:key-status", () => ({ hasKey: Boolean(readKey()) }));

ipcMain.handle("vellum:set-key", (_event, key) => {
  const value = typeof key === "string" ? key.trim() : "";
  if (value && value.length < 12) {
    return { ok: false, error: "That key looks too short." };
  }
  writeKey(value);
  return { ok: true, hasKey: Boolean(readKey()) };
});

ipcMain.handle("vellum:ask", async (_event, payload) => {
  const apiKey = readKey();
  if (!apiKey) return { ok: false, error: "no-key" };
  const question = typeof payload?.question === "string" ? payload.question.trim().slice(0, 400) : "";
  const title = typeof payload?.title === "string" ? payload.title.slice(0, 160) : "Document";
  const paragraphs = Array.isArray(payload?.paragraphs)
    ? payload.paragraphs
        .slice(0, 60)
        .map((paragraph, index) => ({
          id: typeof paragraph?.id === "string" ? paragraph.id.slice(0, 16) : `p${index + 1}`,
          text: typeof paragraph?.text === "string" ? paragraph.text.trim().slice(0, 1200) : "",
        }))
        .filter((paragraph) => paragraph.text)
    : [];
  if (question.length < 2 || paragraphs.length === 0) {
    return { ok: false, error: "bad-input" };
  }

  const context = selectContext(question, paragraphs);
  const allowed = new Set(context.map((paragraph) => paragraph.id));
  const numbered = context.map((paragraph) => `[${paragraph.id}] ${paragraph.text}`).join("\n\n");

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.2,
        max_tokens: 420,
        messages: [
          {
            role: "system",
            content:
              'You answer questions about a single document. Use only the numbered paragraphs. If the answer is not in them, say it is not in the document. Reply with JSON only: {"answer":"plain prose under 120 words","citations":["p1"]}. Citations must be paragraph ids that support the answer. No markdown.',
          },
          {
            role: "user",
            content: `Document: ${title}\n\n${numbered}\n\nQuestion: ${question}`,
          },
        ],
      }),
    });
    if (!response.ok) return { ok: false, error: `status-${response.status}` };
    const body = await response.json();
    const text = body?.choices?.[0]?.message?.content ?? "";
    const parsed = parseModel(text, allowed);
    if (!parsed) return { ok: false, error: "unparsed" };
    return { ok: true, answer: parsed.answer, citations: parsed.citations, mode: "grok" };
  } catch {
    return { ok: false, error: "network" };
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
