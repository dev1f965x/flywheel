import { asClock, asSpan } from "../domain/clock";
import { TASK_LABELS, TODAY_LABELS } from "../domain/labels";
import type { Task } from "../domain/tasks";
import "./TodayBar.css";

interface Props {
  /** Milliseconds the day adds up to, the running stretch included. */
  spentToday: number;
  running?: Task;
  elapsed: number;
}

/** What the day amounts to so far, and what is being timed right now. */
export function TodayBar({ spentToday, running, elapsed }: Props) {
  return (
    <section className="today" aria-label={TODAY_LABELS.heading}>
      {running ? (
        <>
          <p className="today__running">
            <span className="today__dot" aria-hidden="true" />
            {TASK_LABELS.running}
          </p>
          <p className="today__name">{running.name}</p>
          <p className="today__elapsed">{asClock(elapsed)}</p>
        </>
      ) : (
        <p className="today__idle">
          {spentToday > 0 ? TODAY_LABELS.total(asSpan(spentToday)) : TODAY_LABELS.nothing}
        </p>
      )}

      {running && <p className="today__total">{TODAY_LABELS.total(asSpan(spentToday))}</p>}
    </section>
  );
}
