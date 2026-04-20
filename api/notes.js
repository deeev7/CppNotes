const express = require("express");
const fs = require("fs");
const path = require("path");

const notesPath = path.join(__dirname, "..", "notes.txt");

function readNotes() {
  return fs.readFileSync(notesPath, "utf-8");
}

const router = express.Router();

/**
 * GET /api/notes (when this router is mounted at /api/notes)
 * Reads notes.txt from the project root and returns it as plain text.
 */
router.get("/", (req, res) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Content-Type": "text/plain; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });
  res.send(readNotes());
});

module.exports = { router, readNotes, notesPath };
