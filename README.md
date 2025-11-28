# T3 Chat Zipper

[![Install with TamperMonkey](https://img.shields.io/badge/Install%20with-TamperMonkey-blue.svg?logo=Tampermonkey&logoColor=white)](https://github.com/Microck/t3-chat-zipper/raw/main/t3-chat-zipper.user.js)
[![Install with ViolentMonkey](https://img.shields.io/badge/Install%20with-ViolentMonkey-orange.svg?logo=Monkeytype&logoColor=white)](https://github.com/Microck/t3-chat-zipper/raw/main/t3-chat-zipper.user.js)

A ViolentMonkey/TamperMonkey userscript that adds three ZIP export buttons to t3.chat. Automatically extracts code blocks from messages and downloads them as a ZIP archive.

## Features

- **ZIP from Clipboard**: Reads clipboard content with code blocks
- **ZIP from Last Message**: Extracts the most recent message in the chat
- **ZIP from Last X Messages**: Combines multiple recent messages into one ZIP
- Detects filenames from markdown fences, header lines, or info strings
- Creates ZIP files named `t3chat-YYYY-MM-DD-HH-MM.zip`
- Matches T3's reflect button styling (semi-transparent, full color on hover)

## Installation

1. Install a userscript manager: [ViolentMonkey](https://violentmonkey.github.io/) or [TamperMonkey](https://www.tampermonkey.net/)
2. Create a new userscript and paste the code, or use the raw URL
3. Open [https://t3.chat](https://t3.chat/) and refresh the page
4. Three buttons appear in the bottom-right corner

## Usage

**ZIP from Clipboard**  
Copy any message containing code blocks, then click the button.

**ZIP from Last Message**  
Click the button to extract the most recent message automatically.

**ZIP from Last X Messages**  
Click the button, enter a number (e.g., 3), and combine that many recent messages.

The script automatically detects filenames from:
- Header lines above fences: `js/script.js` → ` ```js`
- Fence info strings: ` ```ts filename=src/app.ts`
- Bare paths: ` ``` path/to/file.ext`

## License

MIT 
Microck
