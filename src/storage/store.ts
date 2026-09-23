import type { Session, Task } from "../domain/tasks";

const TASKS = "flywheel.tasks";
const SESSIONS = "flywheel.sessions";

/** Where the list and the hours live: this device, and nowhere else (ADR 6). */
export interface Store {
  readTasks(): Task[];
  writeTasks(tasks: readonly Task[]): void;
  readSessions(): Session[];
  writeSessions(sessions: readonly Session[]): void;
}

export const localStore: Store = {
  readTasks: () => tasksFrom(read(TASKS)),
  writeTasks: (tasks) => write(TASKS, tasks),
  readSessions: () => sessionsFrom(read(SESSIONS)),
  writeSessions: (sessions) => write(SESSIONS, sessions),
};

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    // Blocked or full storage is not worth an error screen; an empty list is honest.
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/**
 * Keeps only what this build understands. A value written by another version, or edited by
 * hand, costs its own entry rather than the whole screen.
 */
export function tasksFrom(stored: unknown): Task[] {
  if (!Array.isArray(stored)) return [];

  return stored.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const { id, name, due } = entry;
    if (typeof id !== "string" || typeof name !== "string" || name.trim() === "") return [];
    if (typeof due !== "string") return [];

    return [
      {
        id,
        name,
        due,
        repeat: repeatFrom(entry.repeat),
        finished: Array.isArray(entry.finished)
          ? entry.finished.filter((day): day is string => typeof day === "string")
          : [],
        done: entry.done === true ? true : undefined,
      },
    ];
  });
}

export function sessionsFrom(stored: unknown): Session[] {
  if (!Array.isArray(stored)) return [];

  return stored.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const { id, taskId, from, until } = entry;
    if (typeof id !== "string" || typeof taskId !== "string" || typeof from !== "string") {
      return [];
    }

    return [{ id, taskId, from, until: typeof until === "string" ? until : undefined }];
  });
}

function repeatFrom(stored: unknown): Task["repeat"] {
  if (!isRecord(stored)) return undefined;
  if (stored.every === "day") return { every: "day" };
  if (stored.every === "days" && typeof stored.count === "number" && stored.count > 0) {
    return { every: "days", count: Math.round(stored.count) };
  }
  if (stored.every === "weekdays" && Array.isArray(stored.on)) {
    const on = stored.on.filter(
      (weekday): weekday is number => typeof weekday === "number" && weekday >= 0 && weekday <= 6,
    );
    return on.length > 0 ? { every: "weekdays", on } : undefined;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
