import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

/**
 * Draws the app's icon — the same wheel the window shows — at the size Tauri's generator
 * wants, and leaves it for `npx tauri icon` to cut into every format.
 *
 *   npm run art:icon   → src-tauri/icons/source.png
 */
const SIZE = 1024;
const OUT = "src-tauri/icons";

const mark = `
<!doctype html>
<html>
  <body style="margin:0">
    <svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 40 40">
      <defs>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e0ad63" />
          <stop offset="1" stop-color="#b57f3c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="9" fill="#14161a" />
      <g fill="none" stroke="url(#brass)" stroke-linecap="round">
        <circle cx="20" cy="20" r="12.5" stroke-width="3" />
        <g stroke-width="1.8" opacity="0.85">
          <path d="M20 8.5v23" />
          <path d="M8.5 20h23" />
          <path d="M11.9 11.9l16.2 16.2" />
          <path d="M28.1 11.9L11.9 28.1" />
        </g>
      </g>
      <circle cx="20" cy="20" r="3.2" fill="url(#brass)" />
    </svg>
  </body>
</html>`;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
await page.setContent(mark);
await page.locator("svg").screenshot({ path: `${OUT}/source.png`, omitBackground: true });
await browser.close();

console.log(`${OUT}/source.png`);
