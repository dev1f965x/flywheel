import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { DiscordPresence, Doing, Link } from "./ports";

const inShell = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** The desktop build's connection to the Discord app running beside it. */
export const tauriPresence: DiscordPresence = {
  async possible() {
    if (!inShell) return false;
    return invoke<boolean>("discord_is_possible").catch(() => false);
  },

  async connect(appId, onLink) {
    const unlisten = await listen<Link>("discord", (event) => onLink(event.payload));
    await invoke("discord_connect", { appId });
    return unlisten;
  },

  async disconnect() {
    await invoke("discord_disconnect").catch(() => {});
  },

  async show(doing: Doing) {
    await invoke("discord_show", { doing }).catch(() => {});
  },

  async clear() {
    await invoke("discord_clear").catch(() => {});
  },
};
