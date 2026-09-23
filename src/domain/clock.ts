import { type Day, dayOf, type Session } from "./tasks";

const newId = () => crypto.randomUUID();

/** The session still running, if one is. Only ever one (ADR 4). */
export function running(sessions: readonly Session[]): Session | undefined {
  return sessions.find((session) => !session.until);
}

/** Starts a task, stopping whatever was running first so the two never overlap. */
export function start(sessions: readonly Session[], taskId: string, now: Date): Session[] {
  const stopped = stop(sessions, now);
  return [...stopped, { id: newId(), taskId, from: now.toISOString() }];
}

export function stop(sessions: readonly Session[], now: Date): Session[] {
  return sessions.map((session) =>
    session.until ? session : { ...session, until: now.toISOString() },
  );
}

/** Milliseconds a session covers, up to now while it is still running. */
export function lengthOf(session: Session, now: Date): number {
  const from = new Date(session.from).getTime();
  const until = session.until ? new Date(session.until).getTime() : now.getTime();
  return Math.max(0, until - from);
}

/**
 * Milliseconds spent on `day`, counting only the part of each session that fell inside it,
 * so a session running over midnight lands on both days rather than on one (ADR 4).
 */
export function spentOn(sessions: readonly Session[], day: Day, now: Date): number {
  const opens = new Date(`${day}T00:00:00`).getTime();
  const closes = new Date(`${day}T00:00:00`);
  closes.setDate(closes.getDate() + 1);

  return sessions.reduce((total, session) => {
    const from = new Date(session.from).getTime();
    const until = session.until ? new Date(session.until).getTime() : now.getTime();
    const overlap = Math.min(until, closes.getTime()) - Math.max(from, opens);
    return total + Math.max(0, overlap);
  }, 0);
}

/** Milliseconds spent on one task, over all the days it was worked on. */
export function spentOnTask(sessions: readonly Session[], taskId: string, now: Date): number {
  return sessions
    .filter((session) => session.taskId === taskId)
    .reduce((total, session) => total + lengthOf(session, now), 0);
}

/** Today, in the machine's own calendar. */
export function today(now: Date): Day {
  return dayOf(now);
}

/** `1:04:09` while it runs, `4분` once it is over: precise where it is moving. */
export function asClock(milliseconds: number): string {
  const total = Math.floor(milliseconds / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = `${Math.floor((total % 3600) / 60)}`.padStart(2, "0");
  const seconds = `${total % 60}`.padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

/** How long something took, in the words a person would use. */
export function asSpan(milliseconds: number): string {
  if (milliseconds < 60_000) return "1분 미만";

  const minutes = Math.round(milliseconds / 60000);
  if (minutes < 60) return `${minutes}분`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
