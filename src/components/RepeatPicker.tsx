import { useState } from "react";
import { REPEAT_LABELS } from "../domain/labels";
import type { Repeat } from "../domain/tasks";
import "./RepeatPicker.css";

type Kind = "none" | "day" | "weekdays" | "days";

interface Props {
  repeat: Repeat | undefined;
  onChange: (repeat: Repeat | undefined) => void;
}

/** How a task comes back, chosen the same way whether it is being written or fixed. */
export function RepeatPicker({ repeat, onChange }: Props) {
  const [kind, setKind] = useState<Kind>(kindOf(repeat));
  const [weekdays, setWeekdays] = useState<number[]>(
    repeat?.every === "weekdays" ? [...repeat.on] : [],
  );
  const [count, setCount] = useState(repeat?.every === "days" ? repeat.count : 2);

  const choose = (next: Kind, on = weekdays, every = count) => {
    setKind(next);
    setWeekdays(on);
    setCount(every);
    onChange(asRepeat(next, on, every));
  };

  return (
    <div className="repeat">
      <div className="repeat__kinds">
        {(["none", "day", "weekdays", "days"] as const).map((each) => (
          <button
            key={each}
            type="button"
            className="repeat__kind"
            aria-pressed={kind === each}
            onClick={() => choose(each)}
          >
            {each === "days" && kind === "days"
              ? REPEAT_LABELS.everyDays(count)
              : REPEAT_LABELS[each]}
          </button>
        ))}
      </div>

      {kind === "weekdays" && (
        <div className="repeat__weekdays">
          <p className="repeat__ask">{REPEAT_LABELS.ask}</p>
          <div className="repeat__circles">
            {REPEAT_LABELS.weekdayNames.map((label, weekday) => (
              <button
                key={label}
                type="button"
                className="repeat__weekday"
                aria-pressed={weekdays.includes(weekday)}
                aria-label={`${label}요일`}
                onClick={() =>
                  choose(
                    "weekdays",
                    weekdays.includes(weekday)
                      ? weekdays.filter((each) => each !== weekday)
                      : [...weekdays, weekday],
                  )
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {kind === "days" && (
        <label className="repeat__every">
          <input
            className="repeat__count"
            type="number"
            min={2}
            max={365}
            value={count}
            aria-label={REPEAT_LABELS.days}
            onChange={(event) =>
              choose("days", weekdays, Math.max(2, Number(event.target.value) || 2))
            }
          />
          일마다
        </label>
      )}
    </div>
  );
}

function kindOf(repeat: Repeat | undefined): Kind {
  if (!repeat) return "none";
  return repeat.every;
}

function asRepeat(kind: Kind, weekdays: number[], count: number): Repeat | undefined {
  if (kind === "day") return { every: "day" };
  if (kind === "weekdays") {
    return weekdays.length > 0 ? { every: "weekdays", on: weekdays } : undefined;
  }
  if (kind === "days") return { every: "days", count };
  return undefined;
}
