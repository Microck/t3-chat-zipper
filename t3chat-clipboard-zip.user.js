// ==UserScript==
// @name         T3 Chat - Clipboard ZIP Button
// @namespace    t3.chat
// @version      3.0
// @description  Read clipboard text with ``` fenced blocks and filenames/paths, then download all as a ZIP
// @author       Microck
// @match        https://t3.chat/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const BTN_ID = "t3zip-from-clipboard";
  if (document.getElementById(BTN_ID)) return;

  // ---------- Inject T3-like styles ----------
  const style = document.createElement("style");
  style.textContent = `
    #${BTN_ID} {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 2147483647;
      appearance: none;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 10px 16px;
      font: 600 13px/1.2 Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      color: #f6eaf7;
      background: linear-gradient(180deg, #a2386e 0%, #6d214c 100%);
      box-shadow:
        0 8px 28px rgba(0, 0, 0, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.06);
      cursor: pointer;
      transition: transform 120ms ease, filter 120ms ease, background 120ms ease,
        box-shadow 120ms ease, opacity 120ms ease;
    }
    #${BTN_ID}:hover {
      filter: brightness(1.06);
      box-shadow:
        0 10px 32px rgba(0, 0, 0, 0.45),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
    #${BTN_ID}:active { transform: translateY(1px); }
    #${BTN_ID}:disabled {
      opacity: 0.65;
      cursor: default;
      filter: grayscale(0.15);
    }
    @media (prefers-color-scheme: light) {
      #${BTN_ID} {
        color: #241321;
        background: linear-gradient(180deg, #f1c2da 0%, #dea1c6 100%);
        border-color: rgba(0, 0, 0, 0.08);
      }
    }
  `;
  document.head.appendChild(style);

  // ---------- Create the button ----------
  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.textContent = "Build ZIP from Clipboard";
  document.body.appendChild(btn);

  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Reading clipboard...";
    try {
      let text = "";
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = prompt("Paste copied T3 output here:") || "";
      }

      if (!text.trim()) {
        alert("Clipboard empty or unreadable.");
        reset();
        return;
      }

      const files = parseFiles(text);
      if (!files.length) {
        alert(
          "No markdown code fences (``` ... ```) with filenames or paths found."
        );
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

      btn.textContent = `Saved ${files.length} file${
        files.length > 1 ? "s" : ""
      }`;
      setTimeout(reset, 1800);
    } catch (e) {
      console.error(e);
      alert("Clipboard access failed; try the manual paste prompt.");
      reset();
    }
  };

  // ---------- Helpers ----------
  function reset() {
    btn.disabled = false;
    btn.textContent = "Build ZIP from Clipboard";
  }

  // Parse multiple formats:
  // A) A line with filename or path (e.g., "js/script.js") above a code fence
  // B) Opening fence contains filename=, file=, path=, or name= (e.g., ```ts filename=src/app.ts)
  function parseFiles(text) {
    const out = [];
    const seen = new Map();

    // A) Header/line before fence providing the path
    const reLineThenFence =
      /(?:^|\n)\s*(?:#{1,6}\s*(?:\d+\.\s*)?)?([\w.\-]+(?:\/[\w.\-]+)*)\s*\n\s*```[^\n]*\n([\s\S]*?)```/g;

    // B) Info string includes filename assignment
    const reFenceWithName =
      /```[^\n]*?\b(?:filename|file|path|name)\s*=\s*([^\s]+)[^\n]*\n([\s\S]*?)```/g;

    // C) Opening fence directly names a path (rare but seen): ``` path/to/file.ext
    const reFenceBarePath =
      /```[ \t]+([\w.\-]+(?:\/[\w.\-]+)*)[^\n]*\n([\s\S]*?)```/g;

    const pushFile = (rawName, content) => {
      const name = uniqueSafePath(rawName);
      if (!name) return;
      out.push({ name, content: stripTrailingNewlines(content) });
    };

    let m;
    while ((m = reLineThenFence.exec(text))) pushFile(m[1], m[2]);
    while ((m = reFenceWithName.exec(text))) pushFile(m[1], m[2]);
    while ((m = reFenceBarePath.exec(text))) pushFile(m[1], m[2]);

    function uniqueSafePath(p) {
      let safe = safeZipPath(p);
      if (!safe) return "";
      if (!seen.has(safe)) {
        seen.set(safe, 1);
        return safe;
      }
      // De-duplicate: add -2, -3 before extension
      const dot = safe.lastIndexOf(".");
      const base = dot > 0 ? safe.slice(0, dot) : safe;
      const ext = dot > 0 ? safe.slice(dot) : "";
      let i = seen.get(safe) + 1;
      let candidate = `${base}-${i}${ext}`;
      while (seen.has(candidate)) {
        i++;
        candidate = `${base}-${i}${ext}`;
      }
      seen.set(safe, i);
      seen.set(candidate, 1);
      return candidate;
    }

    return out;
  }

  // Normalize and defend against traversals; also let JSZip create folders via /
  function safeZipPath(p) {
    if (!p) return "";
    return p
      .replace(/^[\/\\]+/, "") // no leading slash
      .replace(/\\/g, "/") // windows to posix
      .split("/")
      .filter((seg) => seg && seg !== "." && seg !== "..")
      .map((seg) => seg.replace(/[:"*?<>|]/g, "-"))
      .join("/");
  }

  function stripTrailingNewlines(s) {
    return s.replace(/\s*$/, "");
  }

  function timestamp() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(
      d.getHours()
    )}-${p(d.getMinutes())}`;
  }
})();
