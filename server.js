const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.disable("etag");

const PORT = Number(process.env.PORT) || 3000;
const notesPath = path.join(__dirname, "notes.txt");

function readNotes() {
  return fs.readFileSync(notesPath, "utf-8");
}

function noStore(res) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendNotesPlain(req, res) {
  noStore(res);
  res
    .set({
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    })
    .send(readNotes());
}

function sendNotesJson(req, res) {
  noStore(res);
  res.set("X-Content-Type-Options", "nosniff");
  res.json({
    source: "notes.txt",
    content: readNotes(),
  });
}

function sendNotesHtml(req, res) {
  noStore(res);
  const escaped = escapeHtml(readNotes());
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cpp Notes</title>
  <style>
    body { margin: 0; background: #1e1e1e; color: #d4d4d4; }
    pre {
      margin: 0;
      padding: 1rem 1.25rem;
      font-family: Consolas, "Cascadia Mono", "Courier New", monospace;
      font-size: 14px;
      line-height: 1.45;
      white-space: pre-wrap;
      word-break: break-word;
      tab-size: 4;
    }
  </style>
</head>
<body><pre>${escaped}</pre></body>
</html>`;
  res.set("X-Content-Type-Options", "nosniff");
  res.type("html").send(html);
}

// --- Routes (order does not change matching: paths are exact in Express 5) ---

app.get("/", sendNotesHtml);
app.get("/notes", sendNotesHtml);

app.get("/raw", sendNotesPlain);
app.get("/notes.txt", sendNotesPlain);

app.get("/notes.json", sendNotesJson);

// Mounted router: reliable /api/... handling (same as app.get("/api/notes") but clearer)
const api = express.Router();
api.get("/", (req, res) => {
  noStore(res);
  res.set("X-Content-Type-Options", "nosniff");
  res.json({
    ok: true,
    endpoints: {
      jsonNotes: `${req.protocol}://${req.get("host")}/api/notes`,
      jsonFile: `${req.protocol}://${req.get("host")}/notes.json`,
    },
  });
});
api.get("/notes", sendNotesJson);
app.use("/api", api);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`  Browser: / and /notes (HTML)`);
  console.log(`  Plain:   /raw and /notes.txt (text/plain)`);
  console.log(`  JSON:    /api/notes, /notes.json, /api (discovery)`);
});
