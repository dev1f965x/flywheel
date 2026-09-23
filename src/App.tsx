import { useMemo } from "react";
import "./design/base.css";
import "./App.css";
import { AddTask } from "./components/AddTask";
import { DiscordCard } from "./components/DiscordCard";
import { FlywheelMark } from "./components/FlywheelMark";
import { TaskRow } from "./components/TaskRow";
import { TodayBar } from "./components/TodayBar";
import { Undo } from "./components/Undo";
import type { DiscordPresence } from "./discord/ports";
import { useDiscord } from "./discord/useDiscord";
import { APP_NAME, TASK_LABELS } from "./domain/labels";
import { useNow } from "./shell/clock";
import { useFlywheel } from "./state/useFlywheel";
import type { Store } from "./storage/store";

export interface AppProps {
  store: Store;
  presence: DiscordPresence;
  /** Fixed by tests; the app reads a ticking clock. */
  now?: Date;
}

/**
 * The whole app: what is running, what is left today, what was finished, and the line a
 * new task is written on.
 */
export default function App({ store, presence, now }: AppProps) {
  const ticking = useNow();
  const clock = now ?? ticking;
  const flywheel = useFlywheel(store, clock);
  const { runningTask, runningSince } = flywheel;

  const elapsed = runningSince ? clock.getTime() - runningSince.getTime() : 0;
  // A new object every render would ask Discord again every second, so it is memoised.
  const doing = useMemo(
    () =>
      runningTask && runningSince
        ? { task: runningTask.name, startedAt: runningSince.getTime() }
        : undefined,
    [runningTask, runningSince],
  );
  const discord = useDiscord(presence, doing);

  const row = (task: (typeof flywheel.tasks)[number]) => (
    <TaskRow
      key={task.id}
      task={task}
      today={flywheel.today}
      spent={flywheel.spentOn(task.id)}
      running={runningTask?.id === task.id}
      elapsed={elapsed}
      onEdit={(changes) => flywheel.edit(task.id, changes)}
      onToggleFinished={() => flywheel.toggleFinished(task.id)}
      onStart={() => flywheel.startTask(task.id)}
      onStop={flywheel.stopTask}
      onRemove={() => flywheel.remove(task.id)}
    />
  );

  return (
    <div className="app">
      <header className="app__bar">
        <FlywheelMark turning={Boolean(runningTask)} />
        <h1 className="app__name">{APP_NAME}</h1>
        <span className="app__version">v{__APP_VERSION__}</span>
      </header>

      <main className="app__main">
        {(flywheel.tasks.length > 0 || flywheel.spentToday > 0) && (
          <TodayBar spentToday={flywheel.spentToday} running={runningTask} />
        )}

        <section aria-labelledby="due-heading">
          <h2 className="app__heading" id="due-heading">
            {TASK_LABELS.heading}
          </h2>
          {flywheel.due.length === 0 ? (
            <div className="app__empty">
              <p className="app__empty-title">{TASK_LABELS.empty}</p>
              <p className="app__empty-detail">{TASK_LABELS.emptyDetail}</p>
            </div>
          ) : (
            <ul className="app__list">{flywheel.due.map(row)}</ul>
          )}
        </section>

        {flywheel.settled.length > 0 && (
          <section aria-labelledby="done-heading">
            <h2 className="app__heading" id="done-heading">
              {TASK_LABELS.done}
            </h2>
            <ul className="app__list">{flywheel.settled.map(row)}</ul>
          </section>
        )}

        <AddTask onAdd={flywheel.add} />

        {discord.link && (
          <DiscordCard link={discord.link} settings={discord.settings} onChange={discord.change} />
        )}
      </main>

      {flywheel.removed && (
        <Undo
          message={TASK_LABELS.removed(flywheel.removed.name)}
          onUndo={flywheel.undoRemove}
          onDismiss={flywheel.forgetRemoved}
        />
      )}
    </div>
  );
}
