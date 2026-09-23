import { useEffect, useState } from "react";

/** A second, because a running task shows its seconds. */
const TICK_MS = 1_000;

/**
 * The current time, re-read on a timer.
 *
 * Everything on screen is derived from it (ADR 4), so a window left open overnight rolls
 * its day over on its own instead of freezing at whatever it said when it was opened.
 */
export function useNow(interval: number = TICK_MS): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);

  return now;
}
