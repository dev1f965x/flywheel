import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import type { DiscordPresence } from "./discord/ports";
import type { Session, Task } from "./domain/tasks";
import type { Store } from "./storage/store";

const now = new Date("2026-09-21T09:00:00");

function memoryStore(tasks: Task[] = [], sessions: Session[] = []) {
  const written = { tasks, sessions };
  const store: Store = {
    readTasks: () => tasks,
    writeTasks: (next) => {
      written.tasks = [...next];
    },
    readSessions: () => sessions,
    writeSessions: (next) => {
      written.sessions = [...next];
    },
  };
  return { store, written };
}

function fakePresence(possible = false): DiscordPresence {
  return {
    possible: async () => possible,
    connect: async () => () => {},
    disconnect: async () => {},
    show: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
  };
}

const task = (over: Partial<Task> = {}): Task => ({
  id: "1",
  name: "논문 읽기",
  due: "2026-09-21",
  finished: [],
  ...over,
});

function open(tasks: Task[] = [], sessions: Session[] = [], presence = fakePresence()) {
  const { store, written } = memoryStore(tasks, sessions);
  render(<App store={store} presence={presence} now={now} />);
  return { written, presence };
}

describe("App", () => {
  it("asks for something to do when the list is empty", () => {
    open();

    expect(screen.getByText("오늘 할 일이 없어요")).toBeInTheDocument();
  });

  it("writes a task and keeps it", async () => {
    const { written } = open();

    await userEvent.type(screen.getByLabelText("할 일 적기"), "논문 읽기");
    await userEvent.click(screen.getByRole("button", { name: "할 일 적기" }));

    expect(screen.getByText("논문 읽기")).toBeInTheDocument();
    expect(written.tasks.at(-1)?.name).toBe("논문 읽기");
  });

  it("starts the clock and shows it running", async () => {
    const { written } = open([task()]);

    await userEvent.click(screen.getByRole("button", { name: "시작" }));

    expect(screen.getByText("하는 중")).toBeInTheDocument();
    expect(written.sessions).toHaveLength(1);
    expect(written.sessions[0].until).toBeUndefined();
  });

  it("runs one task at a time", async () => {
    const { written } = open([task(), task({ id: "2", name: "운동" })]);
    const rows = screen.getAllByRole("listitem");

    await userEvent.click(within(rows[0]).getByRole("button", { name: "시작" }));
    await userEvent.click(
      within(screen.getAllByRole("listitem")[1]).getByRole("button", { name: "시작" }),
    );

    expect(written.sessions).toHaveLength(2);
    expect(written.sessions[0].until).toBeDefined();
    expect(written.sessions[1].until).toBeUndefined();
  });

  it("sends a routine to tomorrow and counts the streak", async () => {
    const { written } = open([
      task({ name: "운동", repeat: { every: "day" }, finished: ["2026-09-20"] }),
    ]);

    await userEvent.click(screen.getByRole("button", { name: "운동 끝내기" }));

    expect(written.tasks[0].due).toBe("2026-09-22");
    expect(screen.getByText("2일 연속")).toBeInTheDocument();
  });

  it("keeps a finished one-off in sight, struck through", async () => {
    open([task()]);

    await userEvent.click(screen.getByRole("button", { name: "논문 읽기 끝내기" }));

    expect(screen.getByText("끝낸 일")).toBeInTheDocument();
    expect(screen.getByText("오늘 할 일이 없어요")).toBeInTheDocument();
  });

  it("adds the day up as it goes", () => {
    const sessions: Session[] = [
      {
        id: "s",
        taskId: "1",
        from: new Date("2026-09-21T08:00:00").toISOString(),
        until: new Date("2026-09-21T08:45:00").toISOString(),
      },
    ];
    open([task()], sessions);

    expect(screen.getByText("합계 45분")).toBeInTheDocument();
  });

  it("says Discord is out of reach where it is", async () => {
    open();

    expect(await screen.findByText("이 화면에서는 디스코드를 쓸 수 없어요")).toBeInTheDocument();
  });

  it("offers Discord where it can be reached", async () => {
    open([], [], fakePresence(true));

    expect(await screen.findByRole("switch", { name: /하는 일 보여주기/ })).toBeInTheDocument();
  });
});
