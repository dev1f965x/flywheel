import "./FlywheelMark.css";

interface Props {
  /** Turns while a task is being timed, and holds still the rest of the time. */
  turning?: boolean;
}

/** The app's mark: a spoked wheel, which turns while the clock runs. */
export function FlywheelMark({ turning = false }: Props) {
  return (
    <svg
      className="mark"
      data-turning={turning}
      viewBox="0 0 40 40"
      role="img"
      aria-label="flywheel"
    >
      <circle className="mark__rim" cx="20" cy="20" r="14" />
      <circle className="mark__hub" cx="20" cy="20" r="3.4" />
      <g className="mark__spokes">
        <path d="M20 7.5v25" />
        <path d="M7.5 20h25" />
        <path d="M11.2 11.2l17.6 17.6" />
        <path d="M28.8 11.2L11.2 28.8" />
      </g>
    </svg>
  );
}
