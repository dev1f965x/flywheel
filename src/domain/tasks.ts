/** A day in the machine's own calendar, as `YYYY-MM-DD`. */
export type Day = string;

/** How a task comes back. A task without one is done once and gone. */
export type Repeat =
  | { every: "day" }
  /** Sunday is 0, as `Date` counts them. */
  | { every: "weekdays"; on: readonly number[] }
  | { every: "days"; count: number };

export interface Task {
  id: string;
  name: string;
  repeat?: Repeat;
  /** The day it is next due. A task without a repeat is due the day it was written. */
  due: Day;
  /** The days a routine was finished on, newest last. Empty for a task never finished. */
  finished: readonly Day[];
  /** Set once a task without a repeat is done; it stays in the list, struck through. */
  done?: boolean;
}

/** A stretch of work on one task. `until` is missing while it is still running. */
export interface Session {
  id: string;
  taskId: string;
  from: string;
  until?: string;
}

const newId = () => crypto.randomUUID();

export function dayOf(instant: Date): Day {
  const year = instant.getFullYear();
  const month = `${instant.getMonth() + 1}`.padStart(2, "0");
  const date = `${instant.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${date}`;
}

export function addDays(day: Day, count: number): Day {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + count);
  return dayOf(date);
}

export function makeTask(name: string, now: Date, repeat?: Repeat): Task {
  return { id: newId(), name: name.trim(), repeat, due: dayOf(now), finished: [] };
}

/**
 * What finishing a task leaves behind: a routine comes back on its next day, and a task
 * without a repeat stays in the list, struck through, until it is removed.
 */
export function finish(task: Task, on: Day): Task {
  const finished = [...task.finished, on];
  if (!task.repeat) return { ...task, finished, done: true };

  return { ...task, finished, due: nextDue(task.repeat, on) };
}

/** Undoes a finish, for a tap on the wrong row. */
export function unfinish(task: Task, on: Day): Task {
  const finished = task.finished.filter((day) => day !== on);
  if (!task.repeat) return { ...task, finished, done: false };

  return { ...task, finished, due: on };
}

/** The first day after `from` that the repeat falls on. */
export function nextDue(repeat: Repeat, from: Day): Day {
  if (repeat.every === "day") return addDays(from, 1);
  if (repeat.every === "days") return addDays(from, Math.max(1, Math.round(repeat.count)));

  const on = [...new Set(repeat.on)].filter((weekday) => weekday >= 0 && weekday <= 6);
  if (on.length === 0) return addDays(from, 1);

  for (let ahead = 1; ahead <= 7; ahead++) {
    const day = addDays(from, ahead);
    if (on.includes(new Date(`${day}T00:00:00`).getDay())) return day;
  }
  return addDays(from, 1);
}

/** Whether the task is waiting to be done today. */
export function isDue(task: Task, today: Day): boolean {
  return !task.done && task.due <= today;
}

/** Whether it was already finished today, which is how a routine shows as done. */
export function isFinishedOn(task: Task, day: Day): boolean {
  return task.finished.includes(day);
}

/**
 * Days in a row a routine was kept, counting back from today. Today still open does not
 * break it — the day is not over — so the count starts from the last due day before today.
 */
export function streak(task: Task, today: Day): number {
  if (!task.repeat) return 0;

  let day = isFinishedOn(task, today) ? today : previousDue(task.repeat, today);
  let count = 0;
  while (task.finished.includes(day)) {
    count += 1;
    day = previousDue(task.repeat, day);
  }
  return count;
}

/** The last day before `from` that the repeat falls on. */
function previousDue(repeat: Repeat, from: Day): Day {
  if (repeat.every === "day") return addDays(from, -1);
  if (repeat.every === "days") return addDays(from, -Math.max(1, Math.round(repeat.count)));

  const on = [...new Set(repeat.on)];
  for (let back = 1; back <= 7; back++) {
    const day = addDays(from, -back);
    if (on.includes(new Date(`${day}T00:00:00`).getDay())) return day;
  }
  return addDays(from, -1);
}
