import { describe, expect, it } from "vitest";
import { addDays, dayOf, finish, isDue, makeTask, nextDue, streak, unfinish } from "./tasks";

/** A Monday, so the weekday cases read as the calendar does. */
const MONDAY = "2026-09-21";
const now = new Date(`${MONDAY}T09:00:00`);

describe("days", () => {
  it("names the day the machine is on", () => {
    expect(dayOf(new Date("2026-09-21T23:59:59"))).toBe("2026-09-21");
    expect(dayOf(new Date("2026-09-22T00:00:01"))).toBe("2026-09-22");
  });

  it("counts across months and years", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
});

describe("nextDue", () => {
  it("comes back tomorrow when it repeats every day", () => {
    expect(nextDue({ every: "day" }, MONDAY)).toBe("2026-09-22");
  });

  it("counts the days it was given", () => {
    expect(nextDue({ every: "days", count: 3 }, MONDAY)).toBe("2026-09-24");
  });

  it("falls only on the weekdays it was given", () => {
    // Monday and Thursday.
    const repeat = { every: "weekdays", on: [1, 4] } as const;

    expect(nextDue(repeat, MONDAY)).toBe("2026-09-24");
    expect(nextDue(repeat, "2026-09-24")).toBe("2026-09-28");
  });

  it("treats a repeat with no weekdays as daily rather than never", () => {
    expect(nextDue({ every: "weekdays", on: [] }, MONDAY)).toBe("2026-09-22");
  });
});

describe("finishing", () => {
  it("leaves a one-off task in the list, done", () => {
    const task = finish(makeTask("세금 내기", now), MONDAY);

    expect(task.done).toBe(true);
    expect(isDue(task, MONDAY)).toBe(false);
  });

  it("sends a routine to its next day", () => {
    const task = finish(makeTask("운동", now, { every: "day" }), MONDAY);

    expect(task.due).toBe("2026-09-22");
    expect(task.done).toBeUndefined();
    expect(isDue(task, "2026-09-22")).toBe(true);
  });

  it("undoes a finish that was meant for the task below", () => {
    const task = makeTask("운동", now, { every: "day" });
    const back = unfinish(finish(task, MONDAY), MONDAY);

    expect(back.due).toBe(MONDAY);
    expect(back.finished).toEqual([]);
  });
});

describe("streak", () => {
  const daily = makeTask("운동", now, { every: "day" });

  it("counts the days kept in a row", () => {
    const kept = { ...daily, finished: ["2026-09-19", "2026-09-20", MONDAY] };

    expect(streak(kept, MONDAY)).toBe(3);
  });

  it("keeps yesterday's run while today is still open", () => {
    const kept = { ...daily, finished: ["2026-09-19", "2026-09-20"] };

    expect(streak(kept, MONDAY)).toBe(2);
  });

  it("breaks on a missed day", () => {
    const kept = { ...daily, finished: ["2026-09-17", "2026-09-19", "2026-09-20"] };

    expect(streak(kept, "2026-09-20")).toBe(2);
    expect(streak({ ...daily, finished: ["2026-09-18"] }, MONDAY)).toBe(0);
  });

  it("counts a weekday routine by its own days, not by the calendar", () => {
    // Monday and Thursday, kept three times running.
    const weekly = makeTask("보고서", now, { every: "weekdays", on: [1, 4] });
    const kept = { ...weekly, finished: ["2026-09-14", "2026-09-17", MONDAY] };

    expect(streak(kept, MONDAY)).toBe(3);
  });

  it("is nothing for a task that does not repeat", () => {
    expect(streak(finish(makeTask("세금 내기", now), MONDAY), MONDAY)).toBe(0);
  });
});
