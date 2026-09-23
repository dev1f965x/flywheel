import { useCallback, useEffect, useRef, useState } from "react";
import type { DiscordPresence, Doing, Link } from "./ports";

/** What the player chose about Discord, kept beside the tasks (ADR 6). */
export interface DiscordSettings {
  /** Off until the player turns it on; nothing is sent while it is off. */
  on: boolean;
  /** The Discord application the status appears under, from their developer portal. */
  appId: string;
}

export const DISCORD_OFF: DiscordSettings = { on: false, appId: "" };

const KEY = "flywheel.discord";

export function readDiscordSettings(): DiscordSettings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (typeof stored !== "object" || stored === null) return DISCORD_OFF;

    return {
      on: stored.on === true,
      appId: typeof stored.appId === "string" ? stored.appId : "",
    };
  } catch {
    return DISCORD_OFF;
  }
}

/**
 * Keeps Discord told, and says how the connection stands.
 *
 * The status follows the running task: whatever is being timed is what Discord shows, and
 * stopping clears it. Turning the setting off disconnects rather than going quiet, so
 * nothing of ours is left behind in Discord.
 */
export function useDiscord(presence: DiscordPresence, doing: Doing | undefined) {
  const [settings, setSettings] = useState<DiscordSettings>(readDiscordSettings);
  const [reachable, setReachable] = useState<boolean>();
  const [link, setLink] = useState<Link>("off");
  const stopListening = useRef<() => void>(undefined);

  const change = useCallback((changes: Partial<DiscordSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...changes };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Whether Discord can be reached at all decides whether the setting is even offered.
  useEffect(() => {
    let cancelled = false;
    void presence.possible().then((possible) => {
      if (!cancelled) setReachable(possible);
    });
    return () => {
      cancelled = true;
    };
  }, [presence]);

  const wanted = settings.on && settings.appId.trim() !== "";

  useEffect(() => {
    if (reachable !== true) return;

    if (!wanted) {
      void presence.disconnect();
      setLink("off");
      return;
    }

    let cancelled = false;
    setLink("waiting");
    void presence.connect(settings.appId.trim(), setLink).then((stop) => {
      if (cancelled) stop();
      else stopListening.current = stop;
    });

    return () => {
      cancelled = true;
      stopListening.current?.();
      stopListening.current = undefined;
    };
  }, [presence, reachable, wanted, settings.appId]);

  // What is running is what Discord shows, down to the instant it started (ADR 4).
  useEffect(() => {
    if (reachable !== true || !wanted) return;

    if (doing) void presence.show(doing);
    else void presence.clear();
  }, [presence, reachable, wanted, doing]);

  return {
    settings,
    /** Undefined until the answer is in, so the card never flashes the wrong state. */
    link: reachable === undefined ? undefined : reachable ? link : ("unavailable" as const),
    change,
  };
}
