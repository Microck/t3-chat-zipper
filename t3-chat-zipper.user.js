// ==UserScript==
// @name         T3 Chat Zipper
// @namespace    t3.chat
// @version      5.6
// @description  Build ZIP from clipboard, last message, or last X messages
// @author       Microck
// @match        https://t3.chat/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @grant        none
// @license      MIT
// ==/UserScript==


(function () {
 "use strict";

 const BTN_CLIPBOARD_ID = "t3zip-clipboard";
 const BTN_LASTMSG_ID = "t3zip-lastmsg";
 const BTN_LASTX_ID = "t3zip-lastx";

 if (document.getElementById(BTN_CLIPBOARD_ID)) return;

 // ---------- Styles (reflect-like, semi-transparent, color on hover) ----------
 const style = document.createElement("style");
 style.textContent = `
   .t3zip-btn {
     position: fixed;
     right: 20px;
     z-index: 2147483647;
     display: inline-flex;
     align-items: center;
     justify-content: center;
     gap: 0.5rem;
     white-space: nowrap;
     border-radius: 0.5rem;
     padding: 0.5rem 1rem;
     height: 2.25rem;
     font-weight: 600;
     font-size: 0.875rem;
     line-height: 1.25rem;
     color: white;
     background-color: rgba(162, 59, 103, 0.2);
     border: 1px solid rgba(255, 255, 255, 0.08);
     box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.06);
     cursor: pointer;
     user-select: none;
     outline: none;
     transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
   }
   .t3zip-btn:hover { background-color: rgb(162, 59, 103); }
   .t3zip-btn:active { background-color: rgb(162, 59, 103); transform: translateY(1px); }
   .t3zip-btn:disabled { cursor: not-allowed; opacity: 0.55; }
   .t3zip-btn:disabled:hover, .t3zip-btn:disabled:active { background-color: rgba(162, 59, 103, 0.2); transform: none; }
   .dark .t3zip-btn { background-color: rgba(236, 72, 153, 0.18); }
   .dark .t3zip-btn:hover { background-color: rgba(236, 72, 153, 0.75); }
   .dark .t3zip-btn:active { background-color: rgba(236, 72, 153, 0.4); }
   .dark .t3zip-btn:disabled:hover, .dark .t3zip-btn:disabled:active { background-color: rgba(236, 72, 153, 0.18); }
   #${BTN_CLIPBOARD_ID} { bottom: 120px; }
   #${BTN_LASTMSG_ID} { bottom: 70px; }
   #${BTN_LASTX_ID} { bottom: 20px; }
   .t3zip-icon { position: relative; width: 1rem; height: 1rem; }
   .t3zip-default, .t3zip-success { position: absolute; inset: 0; transition: all 200ms ease; }
   .t3zip-btn[data-state="success"] .t3zip-default { transform: scale(0); opacity: 0; }
   .t3zip-btn[data-state="success"] .t3zip-success { transform: scale(1); opacity: 1; }
   .t3zip-success { transform: scale(0); opacity: 0; }
 `;
 document.head.appendChild(style);

 // ---------- Icons ----------
 const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
 const clipboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
 const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
 const layersIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>`;

 // ---------- Button factory ----------
 function createBtn(id, text, iconSvg) {
   const btn = document.createElement("button");
   btn.id = id;
   btn.className = "t3zip-btn";
   btn.innerHTML = `
     <div class="t3zip-icon">
       <div class="t3zip-default">${iconSvg}</div>
       <div class="t3zip-success">${checkIcon}</div>
     </div>
     <span class="w-full text-center select-none">${text}</span>
   `;
   document.body.appendChild(btn);
   return btn;
 }

 const clipboardBtn = createBtn(BTN_CLIPBOARD_ID, "ZIP from Clipboard", clipboardIcon);
 const lastMsgBtn = createBtn(BTN_LASTMSG_ID, "ZIP from Last Message", downloadIcon);
 const lastXBtn = createBtn(BTN_LASTX_ID, "ZIP from Last X Messages", layersIcon);

 // ---------- Message helpers (use T3's own Copy button) ----------
 function getMessageElements() {
   const container = document.querySelector('[role="log"][aria-label="Chat messages"]');
   if (!container) return [];
   return Array.from(container.querySelectorAll("div.flex.justify-\\start, div.flex.justify-\\end"));
 }

 function sleep(ms) {
   return new Promise((resolve) => setTimeout(resolve, ms));
 }

 async function exportMessageText(msgEl) {
   const copySvg = msgEl.querySelector("svg.lucide-copy, svg.lucide-copy-icon");
   if (!copySvg) return "";
   const clickable = copySvg.closest("button, [role='button'], .relative.size-4") || copySvg;
   clickable.click();
   await sleep(200);
   try {
     return await navigator.clipboard.readText();
   } catch {
     return "";
   }
 }

 async function getLastNMessagesText(count) {
   const messages = getMessageElements();
   if (!messages.length) return "";
   const recent = messages.slice(-count);
   const parts = [];
   for (const msg of recent) {
     const text = await exportMessageText(msg);
     if (text?.trim()) parts.push(text.trim());
   }
   return parts.join("\n\n");
 }

 // ---------- ZIP building ----------
 function showState(btn, state) {
   btn.dataset.state = state;
   setTimeout(() => delete btn.dataset.state, 1800);
 }

 async function processAndDownload(text, btn) {
   const files = parseFiles(text);
   if (!files.length) {
     alert("No code fences with filenames or paths found.");
     return false;
   }
   const zip = new JSZip();
   files.forEach((f) => zip.file(f.name, f.content));
   const blob = await zip.generateAsync({ type: "blob" });
   const a = document.createElement("a");
   a.href = URL.createObjectURL(blob);
   a.download = `t3chat-${timestamp()}.zip`;
   a.click();
   URL.revokeObjectURL(a.href);
   const label = btn.querySelector("span");
   const originalText = label.textContent;
   label.textContent = `Saved ${files.length} file${files.length > 1 ? "s" : ""}`;
   showState(btn, "success");
   setTimeout(() => {
     label.textContent = originalText;
   }, 1800);
   return true;
 }

 // ---------- Button handlers (FIXED: always re-enable) ----------
 clipboardBtn.onclick = async () => {
   clipboardBtn.disabled = true;
   try {
     let text = "";
     try {
       text = await navigator.clipboard.readText();
     } catch {
       text = prompt("Paste copied T3 output here:") || "";
     }
     if (!text.trim()) {
       alert("Clipboard empty or unreadable.");
       return;
     }
     await processAndDownload(text, clipboardBtn);
   } catch {
     alert("Clipboard access failed; try the manual paste prompt.");
   } finally {
     clipboardBtn.disabled = false;
   }
 };

 lastMsgBtn.onclick = async () => {
   lastMsgBtn.disabled = true;
   try {
     const text = await getLastNMessagesText(1);
     if (!text.trim()) {
       alert("No messages found or copy failed.");
       return;
     }
     await processAndDownload(text, lastMsgBtn);
   } catch {
     alert("Failed to process last message.");
   } finally {
     lastMsgBtn.disabled = false;
   }
 };

 lastXBtn.onclick = async () => {
   lastXBtn.disabled = true;
   try {
     const input = prompt("How many recent messages to combine?", "3");
     const num = parseInt(input || "", 10);
     if (!num || num < 1) {
       alert("Please enter a valid number.");
       return;
     }
     const text = await getLastNMessagesText(num);
     if (!text.trim()) {
       alert("No messages found or copy failed.");
       return;
     }
     await processAndDownload(text, lastXBtn);
   } catch {
     alert("Failed to process messages.");
   } finally {
     lastXBtn.disabled = false;
   }
 };

 // ---------- Parsing ----------
 function parseFiles(text) {
   const out = [];
   const seen = new Map();
   const reLineThenFence =
     /(?:^|\n)\s*(?:#{1,6}\s*(?:\d+\.\s*)?)?`?([\w.\-]+(?:\/[\w.\-]+)*)`?\s*\n\s*```[^\n]*\n([\s\S]*?)```/g;
   const reFenceWithName =
     /```[^\n]*?\b(?:filename|file|path|name)\s*=\s*([^\s]+)[^\n]*\n([\s\S]*?)```/g;
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

 function safeZipPath(p) {
   if (!p) return "";
   return p
     .replace(/^[\/\\]+/, "")
     .replace(/\\/g, "/")
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
