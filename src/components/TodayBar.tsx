import { asClock } from "../domain/clock";
import { TODAY_LABELS } from "../domain/labels";
import type { Task } from "../domain/tasks";
import "./TodayBar.css";

interface Props {
  /** Milliseconds the day adds up to, the running stretch included. */
  spentToday: number;
  running?: Task;
}

/** What the day amounts to so far, counting up while something is being timed. */
export function TodayBar({ spentToday, running }: Props) {
  return (
    <section className="today" data-running={Boolean(running)} aria-label={TODAY_LABELS.heading}>
      <p className="today__label">{TODAY_LABELS.heading}</p>
      <p className="today__total">{asClock(spentToday)}</p>
      <p className="today__what">
        {running ? (
          <>
            <span className="today__dot" aria-hidden="true" />
            {TODAY_LABELS.doing(running.name)}
          </>
        ) : (
          TODAY_LABELS.idle
        )}
      </p>
    </section>
  );
}
