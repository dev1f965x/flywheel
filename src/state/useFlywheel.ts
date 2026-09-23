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

  const [removed, setRemoved] = useState<{ task: Task; at: number }>();

  const remove = useCallback(
    (id: string) => {
      const at = tasks.findIndex((task) => task.id === id);
      if (at < 0) return;

      setRemoved({ task: tasks[at], at });
      keepTasks(tasks.filter((task) => task.id !== id));
      // The hours stay: a session belongs to the day it happened, not to the task's fate.
      if (runningSession?.taskId === id) keepSessions(clock.stop(sessions, now));
    },
    [tasks, sessions, runningSession, now, keepTasks, keepSessions],
  );

  /** Puts a removed task back where it was, streak and all. */
  const undoRemove = useCallback(() => {
    setRemoved((last) => {
      if (!last) return undefined;
      keepTasks([...tasks.slice(0, last.at), last.task, ...tasks.slice(last.at)]);
      return undefined;
    });
  }, [tasks, keepTasks]);

  const forgetRemoved = useCallback(() => setRemoved(undefined), []);

  /** Changes a task's name or how it repeats, for what was written in a hurry. */
  const edit = useCallback(
    (id: string, changes: { name?: string; repeat?: Task["repeat"] }) => {
      keepTasks(
        tasks.map((task) => {
          if (task.id !== id) return task;
          const named = changes.name?.trim();
          return {
            ...task,
            name: named && named !== "" ? named : task.name,
            repeat: "repeat" in changes ? changes.repeat : task.repeat,
          };
        }),
      );
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
    /** Today's time on one task, which is what a row under 오늘 할 일 should say. */
    spentOn: (taskId: string) =>
      clock.spentOn(
        sessions.filter((session) => session.taskId === taskId),
        today,
        now,
      ),
    add,
    remove,
    removed: removed?.task,
    undoRemove,
    forgetRemoved,
    edit,
    toggleFinished,
    startTask,
    stopTask,
  };
}
