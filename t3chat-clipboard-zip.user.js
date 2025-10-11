// ==UserScript==
// @name         T3 Chat — Clipboard ZIP Button
// @namespace    t3.chat
// @version      2.1
// @description  Reads clipboard text with proper ``` markdown code fences (filename.ext + fenced block) and downloads all as a ZIP file
// @author       you
// @match        https://t3.chat/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const BTN_ID = "t3zip-from-clipboard";
  if (document.getElementById(BTN_ID)) return;

  // ---------- Create the floating button ----------
  const btn = document.createElement("button");
  btn.id = BTN_ID;
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "8px 14px",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
    zIndex: 99999,
  });
  btn.textContent = "📋 Build ZIP from Clipboard";
  document.body.appendChild(btn);

  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "⏳ Reading clipboard...";
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = prompt("Paste copied T3 output here:");
      }

      if (!text.trim()) {
        alert("Clipboard empty or unreadable.");
        reset();
        return;
      }

      const files = parseFiles(text);
      if (!files.length) {
        alert("No markdown code fences (``` … ``` ) with filenames found.");
        reset();
        return;
      }

      const zip = new JSZip();
      files.forEach((f) => zip.file(f.name, f.content));
      const blob = await zip.generateAsync({ type: "blob" });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `t3chat-${timestamp()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);

      btn.textContent = `✅ Saved ${files.length} file${
        files.length > 1 ? "s" : ""
      }`;
      setTimeout(reset, 2000);
    } catch (e) {
      console.error(e);
      alert("Clipboard access failed; try the manual paste prompt.");
      reset();
    }
  };

  // ---------- Helpers ----------
  function reset() {
    btn.disabled = false;
    btn.textContent = "📋 Build ZIP from Clipboard";
  }

  // Matches lines like "### 1. filename.ext" or "filename.ext" followed by ```language … ```
  function parseFiles(text) {
    // Updated regex to handle optional markdown headers (e.g., "### 1. filename.ext")
    // and blank lines between the filename and the code fence.
    const regex =
      /(?:^|\n)\s*(?:###\s*(?:\d+\.\s*)?)?([^\s/\\:"*?<>|]+\.[a-zA-Z0-9]+)\s*```[\w-]*\r?\n([\s\S]*?)```/g;
    const out = [];
    let m;
    while ((m = regex.exec(text))) {
      // Capture groups have shifted:
      // m[1] is now the filename.
      // m[2] is now the content.
      out.push({ name: m[1].trim(), content: m[2] });
    }
    return out;
  }

  function timestamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(
      d.getHours()
    )}-${p(d.getMinutes())}`;
  }
})();
