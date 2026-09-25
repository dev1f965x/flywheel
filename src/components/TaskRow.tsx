import { useState } from "react";
import { asClock, asSpan } from "../domain/clock";
import { describeRepeat, REPEAT_LABELS, TASK_LABELS } from "../domain/labels";
import { addDays, type Day, isFinishedOn, type Repeat, streak, type Task } from "../domain/tasks";
import "./TaskRow.css";
import { RepeatPicker } from "./RepeatPicker";

interface Props {
  task: Task;
  today: Day;
  /** Milliseconds spent on this task today, which is the day the row belongs to. */
  spent: number;
  running: boolean;
  /** Milliseconds the current stretch has been running, when it is. */
  elapsed?: number;
  onEdit: (changes: { name?: string; repeat?: Repeat }) => void;
  onToggleFinished: () => void;
  onStart: () => void;
  onStop: () => void;
  onRemove: () => void;
}

/** One task: what it is, how it repeats, how long it took today, and the clock's button. */
export function TaskRow({
  task,
  today,
  spent,
  running,
  elapsed,
  onEdit,
  onToggleFinished,
  onStart,
  onStop,
  onRemove,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(task.name);
  const [changingRepeat, setChangingRepeat] = useState(false);

  const finished = task.done || isFinishedOn(task, today);
  const kept = task.repeat ? streak(task, today) : 0;
  const late = daysLate(task, today);

  const commitName = () => {
    setRenaming(false);
    if (name.trim() && name.trim() !== task.name) onEdit({ name });
    else setName(task.name);
  };

  return (
    <li className="task" data-running={running} data-finished={finished} data-late={late > 0}>
      <div className="task__line">
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
          {renaming ? (
            <input
              ref={(field) => field?.select()}
              className="task__field"
              value={name}
              aria-label={TASK_LABELS.rename}
              onChange={(event) => setName(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitName();
                if (event.key === "Escape") {
                  setName(task.name);
                  setRenaming(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="task__name"
              title={TASK_LABELS.rename}
              onClick={() => {
                setName(task.name);
                setRenaming(true);
              }}
            >
              {task.name}
            </button>
          )}

          <p className="task__about">
            {task.repeat && (
              <button
                type="button"
                className="task__repeat"
                aria-expanded={changingRepeat}
                title={TASK_LABELS.changeRepeat}
                onClick={() => setChangingRepeat((open) => !open)}
              >
                {finished ? comingBack(task) : describeRepeat(task.repeat)}
              </button>
            )}
            {late > 0 && <span className="task__late">{TASK_LABELS.late(late)}</span>}
            {kept > 1 && <span className="task__streak">{TASK_LABELS.streak(kept)}</span>}
            {spent > 0 && (
              <span>
                {spent < 60_000 ? TASK_LABELS.spentBriefly : TASK_LABELS.spent(asSpan(spent))}
              </span>
            )}
          </p>
        </div>

        {running ? (
          <button type="button" className="task__clock task__clock--running" onClick={onStop}>
            <span className="task__elapsed">{asClock(elapsed ?? 0)}</span>
            {TASK_LABELS.stop}
          </button>
        ) : (
          <button type="button" className="task__clock" onClick={onStart}>
            {TASK_LABELS.start}
          </button>
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
      </div>

      {changingRepeat && (
        <div className="task__repeat-picker">
          <RepeatPicker repeat={task.repeat} onChange={(repeat) => onEdit({ repeat })} />
        </div>
      )}
    </li>
  );
}

/** How many days ago this was due, for a routine that was skipped. */
function daysLate(task: Task, today: Day): number {
  if (task.done || task.due >= today) return 0;

  let days = 0;
  let day = today;
  while (day > task.due && days < 99) {
    day = addDays(day, -1);
    days += 1;
  }
  return days;
}

/** When a finished routine comes back, in the words used on screen. */
function comingBack(task: Task): string {
  if (!task.repeat) return "";
  if (task.repeat.every === "day") return REPEAT_LABELS.tomorrow;
  if (task.repeat.every === "days") return REPEAT_LABELS.inDays(task.repeat.count);

  const weekday = new Date(`${task.due}T00:00:00`).getDay();
  return REPEAT_LABELS.onWeekday(REPEAT_LABELS.weekdayNames[weekday]);
}
