import { useState } from "react";
import { REPEAT_LABELS, TASK_LABELS } from "../domain/labels";
import type { Repeat } from "../domain/tasks";
import "./AddTask.css";

interface Props {
  onAdd: (name: string, repeat?: Repeat) => void;
}

type Kind = "none" | "day" | "weekdays" | "days";

/** The line a task is written on, with the repeat that turns it into a routine. */
export function AddTask({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [count, setCount] = useState(2);

  const repeat = asRepeat(kind, weekdays, count);
  const ready = name.trim() !== "" && (kind !== "weekdays" || weekdays.length > 0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;

    onAdd(name, repeat);
    setName("");
  };

  return (
    <form className="add" onSubmit={submit}>
      <div className="add__line">
        <input
          className="add__field"
          value={name}
          placeholder={TASK_LABELS.addPlaceholder}
          aria-label={TASK_LABELS.add}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="submit" className="add__submit" disabled={!ready}>
          {TASK_LABELS.add}
        </button>
      </div>

      <fieldset className="add__repeat">
        <legend className="visually-hidden">{REPEAT_LABELS.heading}</legend>
        {(["none", "day", "weekdays", "days"] as const).map((each) => (
          <button
            key={each}
            type="button"
            className="add__kind"
            aria-pressed={kind === each}
            onClick={() => setKind(each)}
          >
            {REPEAT_LABELS[each]}
          </button>
        ))}
      </fieldset>

      {kind === "weekdays" && (
        <div className="add__weekdays">
          {REPEAT_LABELS.weekdayNames.map((label, weekday) => (
            <button
              key={label}
              type="button"
              className="add__weekday"
              aria-pressed={weekdays.includes(weekday)}
              aria-label={`${label}요일`}
              onClick={() =>
                setWeekdays((chosen) =>
                  chosen.includes(weekday)
                    ? chosen.filter((each) => each !== weekday)
                    : [...chosen, weekday],
                )
              }
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {kind === "days" && (
        <label className="add__every">
          <input
            className="add__count"
            type="number"
            min={2}
            max={365}
            value={count}
            aria-label={REPEAT_LABELS.days}
            onChange={(event) => setCount(Math.max(2, Number(event.target.value) || 2))}
          />
          {REPEAT_LABELS.everyDays(count).replace(`${count}`, "")}
        </label>
      )}
    </form>
  );
}

function asRepeat(kind: Kind, weekdays: number[], count: number): Repeat | undefined {
  if (kind === "day") return { every: "day" };
  if (kind === "weekdays")
    return weekdays.length > 0 ? { every: "weekdays", on: weekdays } : undefined;
  if (kind === "days") return { every: "days", count };
  return undefined;
}
