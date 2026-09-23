import type { Link } from "../discord/ports";
import type { DiscordSettings } from "../discord/useDiscord";
import { DISCORD_LABELS } from "../domain/labels";
import "./DiscordCard.css";

interface Props {
  link: Link;
  settings: DiscordSettings;
  onChange: (changes: Partial<DiscordSettings>) => void;
}

const SAYS: Record<Link, string> = {
  connected: DISCORD_LABELS.connected,
  waiting: DISCORD_LABELS.waiting,
  off: DISCORD_LABELS.off,
  unavailable: DISCORD_LABELS.unavailable,
};

/** Whether friends see what is running, and whether Discord is listening. */
export function DiscordCard({ link, settings, onChange }: Props) {
  const unavailable = link === "unavailable";

  return (
    <section className="discord" data-link={link} aria-labelledby="discord-heading">
      <header className="discord__header">
        <h2 className="discord__heading" id="discord-heading">
          {DISCORD_LABELS.heading}
        </h2>
        <p className="discord__link">
          <span className="discord__dot" aria-hidden="true" />
          {SAYS[link]}
        </p>
      </header>

      {unavailable ? (
        <p className="discord__detail">{DISCORD_LABELS.unavailableDetail}</p>
      ) : (
        <>
          <label className="discord__switch">
            <input
              type="checkbox"
              role="switch"
              aria-checked={settings.on}
              checked={settings.on}
              onChange={(event) => onChange({ on: event.target.checked })}
            />
            {DISCORD_LABELS.show}
          </label>

          {settings.on && (
            <>
              <input
                className="discord__id"
                value={settings.appId}
                placeholder={DISCORD_LABELS.appIdPlaceholder}
                aria-label={DISCORD_LABELS.appId}
                onChange={(event) => onChange({ appId: event.target.value })}
              />
              <p className="discord__detail">
                {link === "waiting" ? DISCORD_LABELS.waitingDetail : DISCORD_LABELS.appIdHint}
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}
