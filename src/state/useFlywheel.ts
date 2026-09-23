import { useCallback, useMemo, useState } from "react";
import * as clock from "../domain/clock";
import {
  finish,
  isDue,
  isFinishedOn,
  makeTask,
  type Repeat,
  type Session,
  type Task,
  unfinish,
} from "../domain/tasks";
import type { Store } from "../storage/store";

/**
 * Everything the window works with: the list, the hours, and which task is running.
 *
 * The store is written on every change rather than on a save button — the app is a list
 * someone edits in passing, and a list that loses an edit is worse than no list.
 */
export function useFlywheel(store: Store, now: Date) {
  const [tasks, setTasks] = useState<Task[]>(() => store.readTasks());
  const [sessions, setSessions] = useState<Session[]>(() => store.readSessions());

  const today = clock.today(now);
  const runningSession = useMemo(() => clock.running(sessions), [sessions]);
  const runningTask = useMemo(
    () => tasks.find((task) => task.id === runningSession?.taskId),
    [tasks, runningSession],
  );

  const keepTasks = useCallback(
    (next: Task[]) => {
      setTasks(next);
      store.writeTasks(next);
    },
    [store],
  );

  const keepSessions = useCallback(
    (next: Session[]) => {
      setSessions(next);
      store.writeSessions(next);
    },
    [store],
  );

  const add = useCallback(
    (name: string, repeat?: Repeat) => keepTasks([...tasks, makeTask(name, now, repeat)]),
    [tasks, now, keepTasks],
  );

  const remove = useCallback(
    (id: string) => {
      keepTasks(tasks.filter((task) => task.id !== id));
      // The hours stay: a session belongs to the day it happened, not to the task's fate.
      if (runningSession?.taskId === id) keepSessions(clock.stop(sessions, now));
    },
    [tasks, sessions, runningSession, now, keepTasks, keepSessions],
  );

  const move = useCallback(
    (id: string, by: number) => {
      const at = tasks.findIndex((task) => task.id === id);
      const to = at + by;
      if (at < 0 || to < 0 || to >= tasks.length) return;

      const next = [...tasks];
      [next[at], next[to]] = [next[to], next[at]];
      keepTasks(next);
    },
    [tasks, keepTasks],
  );

  const toggleFinished = useCallback(
    (id: string) => {
      keepTasks(
        tasks.map((task) => {
          if (task.id !== id) return task;
          return isFinishedOn(task, today) ? unfinish(task, today) : finish(task, today);
        }),
      );
      // Finishing what is running stops the clock: the work is over.
      if (runningSession?.taskId === id) keepSessions(clock.stop(sessions, now));
    },
    [tasks, sessions, runningSession, today, now, keepTasks, keepSessions],
  );

  const startTask = useCallback(
    (id: string) => keepSessions(clock.start(sessions, id, now)),
    [sessions, now, keepSessions],
  );

  const stopTask = useCallback(
    () => keepSessions(clock.stop(sessions, now)),
    [sessions, now, keepSessions],
  );

  const due = useMemo(
    () => tasks.filter((task) => isDue(task, today) && !isFinishedOn(task, today)),
    [tasks, today],
  );
  const settled = useMemo(
    () => tasks.filter((task) => task.done || isFinishedOn(task, today)),
    [tasks, today],
  );

  return {
    tasks,
    due,
    settled,
    sessions,
    today,
    runningTask,
    runningSince: runningSession ? new Date(runningSession.from) : undefined,
    spentToday: clock.spentOn(sessions, today, now),
    spentOn: (taskId: string) => clock.spentOnTask(sessions, taskId, now),
    add,
    remove,
    move,
    toggleFinished,
    startTask,
    stopTask,
  };
}
