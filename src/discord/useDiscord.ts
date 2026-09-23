import { useCallback, useEffect, useRef, useState } from "react";
import type { DiscordPresence, Link } from "./ports";

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
 * nothing is left behind in Discord.
 */
export function useDiscord(
  presence: DiscordPresence,
  doing: { task: string; startedAt: number } | undefined,
) {
  const [settings, setSettings] = useState<DiscordSettings>(readDiscordSettings);
  const [link, setLink] = useState<Link>("off");
  const connected = useRef<(() => void) | undefined>(undefined);

  const change = useCallback((changes: Partial<DiscordSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...changes };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Whether Discord is reachable at all decides whether the setting is even offered.
  useEffect(() => {
    let cancelled = false;
    void presence.possible().then((possible) => {
      if (!cancelled && !possible) setLink("unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, [presence]);

  useEffect(() => {
    if (link === "unavailable") return;

    let cancelled = false;
    if (!settings.on || !settings.appId.trim()) {
      connected.current?.();
      connected.current = undefined;
      void presence.disconnect();
      setLink("off");
      return;
    }

    setLink("waiting");
    void presence.connect(settings.appId.trim(), setLink).then((stop) => {
      if (cancelled) stop();
      else connected.current = stop;
    });

    return () => {
      cancelled = true;
      connected.current?.();
      connected.current = undefined;
    };
  }, [presence, settings.on, settings.appId, link === "unavailable"]);

  // What is running is what Discord shows, down to the instant it started (ADR 4).
  useEffect(() => {
    if (link !== "connected" && link !== "waiting") return;

    if (doing) void presence.show(doing);
    else void presence.clear();
  }, [presence, doing, link]);

  return { settings, link, change };
}
