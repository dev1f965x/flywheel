import { describe, expect, it } from "vitest";
import { asClock, asSpan, lengthOf, running, spentOn, spentOnTask, start, stop } from "./clock";
import type { Session } from "./tasks";

const at = (time: string) => new Date(`2026-09-21T${time}`);

const session = (id: string, taskId: string, from: string, until?: string): Session => ({
  id,
  taskId,
  from: at(from).toISOString(),
  until: until ? at(until).toISOString() : undefined,
});

describe("one at a time", () => {
  it("stops what was running when another starts", () => {
    const sessions = start([session("1", "a", "09:00:00")], "b", at("10:00:00"));

    expect(sessions).toHaveLength(2);
    expect(sessions[0].until).toBe(at("10:00:00").toISOString());
    expect(running(sessions)?.taskId).toBe("b");
  });

  it("leaves nothing running after a stop", () => {
    const sessions = stop(start([], "a", at("09:00:00")), at("09:30:00"));

    expect(running(sessions)).toBeUndefined();
    expect(lengthOf(sessions[0], at("11:00:00"))).toBe(30 * 60 * 1000);
  });

  it("counts a running session up to now", () => {
    const sessions = start([], "a", at("09:00:00"));

    expect(lengthOf(sessions[0], at("09:00:45"))).toBe(45 * 1000);
  });
});

describe("what a day adds up to", () => {
  it("sums the sessions that happened in it", () => {
    const sessions = [
      session("1", "a", "09:00:00", "09:30:00"),
      session("2", "b", "13:00:00", "14:00:00"),
    ];

    expect(spentOn(sessions, "2026-09-21", at("15:00:00"))).toBe(90 * 60 * 1000);
  });

  it("gives each day only the part that fell inside it", () => {
    const overnight: Session = {
      id: "1",
      taskId: "a",
      from: new Date("2026-09-21T23:00:00").toISOString(),
      until: new Date("2026-09-22T01:00:00").toISOString(),
    };

    expect(spentOn([overnight], "2026-09-21", at("23:59:00"))).toBe(60 * 60 * 1000);
    expect(spentOn([overnight], "2026-09-22", new Date("2026-09-22T02:00:00"))).toBe(
      60 * 60 * 1000,
    );
  });

  it("counts a still-running session up to now", () => {
    const sessions = [session("1", "a", "09:00:00")];

    expect(spentOn(sessions, "2026-09-21", at("09:20:00"))).toBe(20 * 60 * 1000);
  });

  it("adds up one task across its days", () => {
    const sessions = [
      session("1", "a", "09:00:00", "09:30:00"),
      session("2", "b", "10:00:00", "11:00:00"),
      session("3", "a", "13:00:00", "13:15:00"),
    ];

    expect(spentOnTask(sessions, "a", at("15:00:00"))).toBe(45 * 60 * 1000);
  });
});

describe("saying how long", () => {
  it("counts the running clock to the second", () => {
    expect(asClock(0)).toBe("00:00");
    expect(asClock(65 * 1000)).toBe("01:05");
    expect(asClock(3725 * 1000)).toBe("1:02:05");
  });

  it("says a finished stretch the way a person would", () => {
    expect(asSpan(30 * 1000)).toBe("1분 미만");
    expect(asSpan(25 * 60 * 1000)).toBe("25분");
    expect(asSpan(60 * 60 * 1000)).toBe("1시간");
    expect(asSpan(95 * 60 * 1000)).toBe("1시간 35분");
  });
});
