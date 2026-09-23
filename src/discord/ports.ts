/** How the connection to the Discord app stands (ADR 5). */
export type Link = "off" | "waiting" | "connected" | "unavailable";

/** What is being worked on, as Discord will show it. */
export interface Doing {
  task: string;
  startedAt: number;
}

/** Everything the window needs from Discord, so a test can stand in for all of it. */
export interface DiscordPresence {
  /** False in a browser tab and on a phone, where Rich Presence cannot reach. */
  possible(): Promise<boolean>;
  /** Opens the connection under an application id, and follows how it goes. */
  connect(appId: string, onLink: (link: Link) => void): Promise<() => void>;
  disconnect(): Promise<void>;
  show(doing: Doing): Promise<void>;
  clear(): Promise<void>;
}
