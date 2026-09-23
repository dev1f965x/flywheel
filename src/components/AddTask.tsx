import { useState } from "react";
import { TASK_LABELS } from "../domain/labels";
import type { Repeat } from "../domain/tasks";
import "./AddTask.css";
import { RepeatPicker } from "./RepeatPicker";

interface Props {
  onAdd: (name: string, repeat?: Repeat) => void;
}

/** The line a task is written on, with the repeat that turns it into a routine. */
export function AddTask({ onAdd }: Props) {
  const [name, setName] = useState("");
  const [repeat, setRepeat] = useState<Repeat>();
  /** Remounts the picker after a submit, so the next task starts from 한 번만 again. */
  const [round, setRound] = useState(0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim() === "") return;

    onAdd(name, repeat);
    setName("");
    setRepeat(undefined);
    setRound((each) => each + 1);
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
        <button type="submit" className="add__submit" disabled={name.trim() === ""}>
          {TASK_LABELS.add}
        </button>
      </div>

      <RepeatPicker key={round} repeat={repeat} onChange={setRepeat} />
    </form>
  );
}
