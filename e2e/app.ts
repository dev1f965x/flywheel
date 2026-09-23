import type { Page } from "@playwright/test";

/** Opens the app with a list and hours already stored, as a returning visitor finds it. */
export async function openApp(page: Page, tasks: unknown[] = [], sessions: unknown[] = []) {
  // Seeded once, not on every navigation, so a reload sees what the app itself wrote.
  await page.addInitScript(
    ([tasks, sessions]) => {
      if (window.localStorage.getItem("flywheel.tasks") !== null) return;
      window.localStorage.setItem("flywheel.tasks", JSON.stringify(tasks));
      window.localStorage.setItem("flywheel.sessions", JSON.stringify(sessions));
    },
    [tasks, sessions],
  );
  await page.goto("/");
  await page.getByRole("heading", { name: "flywheel", level: 1 }).waitFor();
}

/** What the app has stored under one of its keys. */
export function stored(page: Page, key: "tasks" | "sessions") {
  return page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(`flywheel.${key}`) ?? "[]"),
    key,
  );
}
