import { expect, test } from "@playwright/test";
import { openApp, stored } from "./app";

const paper = { id: "1", name: "논문 읽기", due: "2026-09-21", finished: [] };

test("a first visit asks for something to do, and takes it", async ({ page }) => {
  await openApp(page);
  await expect(page.getByText("오늘 할 일이 없어요")).toBeVisible();

  await page.getByLabel("할 일 적기").fill("논문 읽기");
  await page.getByRole("button", { name: "할 일 적기" }).click();

  await expect(page.getByText("논문 읽기")).toBeVisible();
  await expect.poll(() => stored(page, "tasks")).toMatchObject([{ name: "논문 읽기" }]);
});

test("starting a task runs the clock, and stopping writes the session", async ({ page }) => {
  await openApp(page, [paper]);

  await page.getByRole("button", { name: "시작" }).click();
  await expect(page.getByText("하는 중")).toBeVisible();
  await expect.poll(() => stored(page, "sessions")).toMatchObject([{ taskId: "1" }]);

  await page.getByRole("button", { name: "멈춤" }).click();

  await expect(page.getByText("하는 중")).toBeHidden();
  const sessions = await stored(page, "sessions");
  expect(sessions[0].until).toBeTruthy();
});

test("a task left running is still running after a reload", async ({ page }) => {
  await openApp(page, [paper]);
  await page.getByRole("button", { name: "시작" }).click();

  await page.reload();

  await expect(page.getByText("하는 중")).toBeVisible();
  await expect(page.getByRole("button", { name: "멈춤" })).toBeVisible();
});

test("a daily routine comes back tomorrow with a streak", async ({ page }) => {
  await openApp(page, [
    { id: "2", name: "운동", due: "2026-09-21", finished: [], repeat: { every: "day" } },
  ]);

  await page.getByRole("button", { name: "운동 끝내기" }).click();

  await expect(page.getByText("끝낸 일")).toBeVisible();
  await expect(page.getByText("1일 연속")).toBeVisible();
  const tasks = await stored(page, "tasks");
  expect(tasks[0].due).not.toBe("2026-09-21");
});

test("a routine can be given the weekdays it falls on", async ({ page }) => {
  await openApp(page);

  await page.getByLabel("할 일 적기").fill("보고서");
  await page.getByRole("button", { name: "요일마다" }).click();
  await page.getByRole("button", { name: "월요일" }).click();
  await page.getByRole("button", { name: "목요일" }).click();
  await page.getByRole("button", { name: "할 일 적기" }).click();

  await expect(page.getByText("월·목요일")).toBeVisible();
});

test("the browser says Discord is out of its reach", async ({ page }) => {
  await openApp(page);

  await expect(page.getByText("이 화면에서는 디스코드를 쓸 수 없어요")).toBeVisible();
});
