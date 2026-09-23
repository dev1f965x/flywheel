import { asClock, asSpan } from "../domain/clock";
import { describeRepeat, TASK_LABELS } from "../domain/labels";
import { type Day, isFinishedOn, streak, type Task } from "../domain/tasks";
import "./TaskRow.css";

interface Props {
  task: Task;
  today: Day;
  /** Milliseconds this task has taken, all days counted. */
  spent: number;
  running: boolean;
  /** Milliseconds the current stretch has been running, when it is. */
  elapsed?: number;
  onToggleFinished: () => void;
  onStart: () => void;
  onStop: () => void;
  onRemove: () => void;
}

/** One task: what it is, how it repeats, how long it has taken, and the clock's button. */
export function TaskRow({
  task,
  today,
  spent,
  running,
  elapsed,
  onToggleFinished,
  onStart,
  onStop,
  onRemove,
}: Props) {
  const finished = task.done || isFinishedOn(task, today);
  const kept = task.repeat ? streak(task, today) : 0;

  return (
    <li className="task" data-running={running} data-finished={finished}>
      <button
        type="button"
        className="task__check"
        aria-pressed={finished}
        aria-label={finished ? TASK_LABELS.unfinish(task.name) : TASK_LABELS.finish(task.name)}
        onClick={onToggleFinished}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.5" y="1.5" width="13" height="13" rx="4" />
          <path d="m5 8.3 2.2 2.2L11.4 6" />
        </svg>
      </button>

      <div className="task__what">
        <p className="task__name">{task.name}</p>
        <p className="task__about">
          {task.repeat && <span className="task__repeat">{describeRepeat(task.repeat)}</span>}
          {kept > 0 && <span className="task__streak">{TASK_LABELS.streak(kept)}</span>}
          {spent > 0 && <span>{TASK_LABELS.spent(asSpan(spent))}</span>}
        </p>
      </div>

      {running ? (
        <button type="button" className="task__clock task__clock--running" onClick={onStop}>
          <span className="task__elapsed">{asClock(elapsed ?? 0)}</span>
          {TASK_LABELS.stop}
        </button>
      ) : (
        !finished && (
          <button type="button" className="task__clock" onClick={onStart}>
            {TASK_LABELS.start}
          </button>
        )
      )}

      <button
        type="button"
        className="task__remove"
        aria-label={TASK_LABELS.remove(task.name)}
        onClick={onRemove}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="m3 3 6 6M9 3l-6 6" />
        </svg>
      </button>
    </li>
  );
}
