# T3 Chat Clipboard ZIP Button

[![Install with TamperMonkey](https://img.shields.io/badge/Install%20with-TamperMonkey-blue.svg?logo=Tampermonkey&logoColor=white)](https://github.com/Microck/t3chat-clipboard-zip/raw/main/t3chat-clipboard-zip.user.js)
[![Install with ViolentMonkey](https://img.shields.io/badge/Install%20with-ViolentMonkey-orange.svg?logo=Monkeytype&logoColor=white)](https://github.com/Microck/t3chat-clipboard-zip/raw/main/t3chat-clipboard-zip.user.js)
[![Install Userscript](https://img.shields.io/badge/Install%20with-TamperMonkey%2FViolentMonkey-blue?style=for-the-badge)](https://github.com/Microck/t3chat-clipboard-zip/raw/main/t3chat-clipboard-zip.user.js)

This is a simple ViolentMonkey/TamperMonkey userscript that adds a "Build ZIP from Clipboard" button to t3.chat.  
When you copy a T3.Chat message that contains multiple code blocks with markdown fences (```), it reads your clipboard, extracts each file, and downloads them together as a .zip archive.

## Features
- Detects filename lines followed by markdown code fences.
- Reads content directly from the clipboard (or allows manual paste).
- Creates a ZIP file named t3chat-YYYY-MM-DD-HH-MM.zip.
- Works entirely offline and in the browser.

## Installation
1. Install a userscript manager such as ViolentMonkey or TamperMonkey.
2. Create a new userscript and paste the contents of `t3chat-clipboard-zip.user.js`,  
   or use the raw GitHub URL once uploaded.
3. Open [https://t3.chat](https://t3.chat/) and refresh the page.
4. A "Build ZIP from Clipboard" button will appear in the bottom-right corner.

## Usage
1. Copy a T3.Chat output message that contains code files.
2. Click the "Build ZIP from Clipboard" button.
3. The script will download a ZIP file containing all detected files.
