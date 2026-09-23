import { mkdirSync, rmSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import { createServer } from "vite";

/**
 * Photographs every state of the app, for design review and the README.
 *
 * The same page runs in a browser tab, in the Windows window, and in the Android app, so
 * one set of shots covers all three — at a phone's width, and at a desktop window's.
 *
 *   npm run screens        → screens/*.png
 */
const PHONE = { width: 420, height: 820 };
const DESKTOP = { width: 760, height: 780 };
const PORT = 1430;
const OUT = "screens";

interface Shot {
  name: string;
  tasks?: unknown[];
  sessions?: unknown[];
  act?: (page: Page) => Promise<void>;
  viewport?: { width: number; height: number };
}

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

const tasks = [
  { id: "1", name: "논문 읽기", due: today, finished: [] },
  {
    id: "2",
    name: "운동",
    due: today,
    finished: [yesterday],
    repeat: { every: "day" },
  },
  {
    id: "3",
    name: "주간 보고서",
    due: today,
    finished: [],
    repeat: { every: "weekdays", on: [1, 4] },
  },
];

const anHourAgo = new Date(Date.now() - 3_600_000).toISOString();
const halfAnHourAgo = new Date(Date.now() - 1_800_000).toISOString();
const sessions = [{ id: "s1", taskId: "1", from: anHourAgo, until: halfAnHourAgo }];

const startFirst = (page: Page) => page.getByRole("button", { name: "시작" }).first().click();

const SHOTS: Shot[] = [
  { name: "empty" },
  { name: "day", tasks, sessions },
  { name: "running", tasks, sessions, act: startFirst },
  {
    name: "finished",
    tasks,
    sessions,
    act: (page) => page.getByRole("button", { name: "운동 끝내기" }).click(),
  },
  {
    name: "repeat-weekdays",
    act: async (page) => {
      await page.getByLabel("할 일 적기").fill("주간 보고서");
      await page.getByRole("button", { name: "요일마다" }).click();
      await page.getByRole("button", { name: "월요일" }).click();
    },
  },
  { name: "desktop-day", tasks, sessions, viewport: DESKTOP },
  { name: "desktop-running", tasks, sessions, act: startFirst, viewport: DESKTOP },
];

async function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  const server = await createServer({
    server: { port: PORT, strictPort: true },
    logLevel: "error",
  });
  await server.listen();
  // Headless Chromium hides scrollbars; the real window has one, and it takes room.
  const browser = await chromium.launch({
    channel: "msedge",
    ignoreDefaultArgs: ["--hide-scrollbars"],
  });

  try {
    for (const shot of SHOTS) {
      const page = await browser.newPage({
        viewport: shot.viewport ?? PHONE,
        deviceScaleFactor: 2,
      });
      await page.addInitScript(
        ([tasks, sessions]) => {
          window.localStorage.setItem("flywheel.tasks", JSON.stringify(tasks));
          window.localStorage.setItem("flywheel.sessions", JSON.stringify(sessions));
        },
        [shot.tasks ?? [], shot.sessions ?? []],
      );
      await page.goto(`http://localhost:${PORT}`);
      await page.getByRole("heading", { name: "flywheel", level: 1 }).waitFor();
      await shot.act?.(page);
      // Park the pointer where nothing reacts to it, so no hover state is photographed.
      await page.mouse.move(1, (shot.viewport ?? PHONE).height - 1);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/${shot.name}.png` });
      await page.close();
      console.log(`${OUT}/${shot.name}.png`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
