import { FC } from "react";

// Stroke colors inherit from `currentColor` (set by the wrapper's text class).
// Light-fill rectangles and the dark "screen" rectangle carry their own Tailwind
// classes so dark mode swaps them correctly.
const EmptyStateIllustration: FC = () => {
  const lightFillClass = "fill-gray-0 dark:fill-gray-0-dark";
  const boxStrokeClass = "stroke-blue-500 dark:stroke-blue-400-dark";
  return (
    <svg
      width="189"
      height="101"
      viewBox="0 0 189 101"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="text-blue-500 dark:text-blue-400-dark"
    >
      <line
        x1="130.224"
        y1="64.1609"
        x2="132.682"
        y2="68.1166"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M132.634 68.3184L128.544 70.4434"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <line
        x1="0.5"
        y1="-0.5"
        x2="5.15685"
        y2="-0.5"
        transform="matrix(0.720829 -0.693113 -0.693113 -0.720829 134 52.7487)"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M138.068 49.3278L134.627 46.2597"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M70.3213 38.4803L46.713 30.3397C43.4863 29.2271 41.3209 26.1898 41.3209 22.7767L41.321 11.4804"
        stroke="currentColor"
        strokeDasharray="6 2"
      />
      <line
        x1="0.5"
        y1="-0.5"
        x2="5.15685"
        y2="-0.5"
        transform="matrix(0.527693 -0.849435 -0.849435 -0.527693 129.536 36.483)"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M132.634 32.1648L128.544 30.0397"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <rect
        x="26.25"
        y="0.25"
        width="30.5"
        height="18.5"
        rx="1.75"
        strokeWidth="1"
        className={`${lightFillClass} ${boxStrokeClass}`}
      />
      <path
        d="M114.96 38.4803L138.568 30.3397C141.795 29.2271 143.96 26.1898 143.96 22.7767L143.96 11.4804"
        stroke="currentColor"
        strokeDasharray="6 2"
      />
      <rect
        x="-0.25"
        y="0.25"
        width="30.5"
        height="18.5"
        rx="1.75"
        transform="matrix(-1 0 0 1 158.781 0)"
        strokeWidth="1"
        className={`${lightFillClass} ${boxStrokeClass}`}
      />
      <path
        d="M114.96 62.0001L138.568 70.1407C141.795 71.2534 143.96 74.2907 143.96 77.7038L143.96 89.0001"
        stroke="currentColor"
        strokeDasharray="6 2"
      />
      <rect
        x="159.031"
        y="100.23"
        width="30.5"
        height="18.5"
        rx="1.75"
        transform="rotate(-180 159.031 100.23)"
        strokeWidth="1"
        className={`${lightFillClass} ${boxStrokeClass}`}
      />
      <path
        d="M70.3213 62.0001L46.713 70.1407C43.4863 71.2534 41.3209 74.2907 41.3209 77.7038L41.321 89.0001"
        stroke="currentColor"
        strokeDasharray="6 2"
      />
      <rect
        x="0.25"
        y="-0.25"
        width="30.5"
        height="18.5"
        rx="1.75"
        transform="matrix(1 0 0 -1 26 99.9805)"
        strokeWidth="1"
        className={`${lightFillClass} ${boxStrokeClass}`}
      />
      <line
        x1="16"
        y1="49.5"
        x2="174"
        y2="49.5"
        stroke="currentColor"
        strokeDasharray="6 2"
      />
      <rect
        x="-0.25"
        y="0.25"
        width="30.5"
        height="18.5"
        rx="1.75"
        transform="matrix(-1 0 0 1 188.5 41)"
        strokeWidth="1"
        className={`${lightFillClass} ${boxStrokeClass}`}
      />
      <rect
        x="-0.25"
        y="0.25"
        width="30.5"
        height="18.5"
        rx="1.75"
        transform="matrix(-1 0 0 1 30.5 41)"
        strokeWidth="1"
        className={`${lightFillClass} ${boxStrokeClass}`}
      />
      <rect
        x="62"
        y="31"
        width="62"
        height="38"
        rx="4"
        className="fill-blue-700 dark:fill-blue-700-dark"
      />
      <line
        x1="88.4778"
        y1="56.7885"
        x2="99.7611"
        y2="43.5629"
        className="stroke-gray-0 dark:stroke-gray-0-dark"
        strokeLinecap="round"
      />
      <circle
        cx="89.5"
        cy="45.5"
        r="3"
        className="stroke-gray-0 dark:stroke-gray-0-dark"
      />
      <circle
        cx="98.5"
        cy="54.5"
        r="3"
        className="stroke-gray-0 dark:stroke-gray-0-dark"
      />
      <line
        x1="0.5"
        y1="-0.5"
        x2="5.15685"
        y2="-0.5"
        transform="matrix(0.527693 -0.849435 -0.849435 -0.527693 52.5356 71.4829)"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M55.6343 67.1646L51.5435 65.0395"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <line
        x1="0.5"
        y1="-0.5"
        x2="5.15685"
        y2="-0.5"
        transform="matrix(0.720829 -0.693113 -0.693113 -0.720829 39 52.7487)"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M43.0679 49.3278L39.6273 46.2597"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <line
        x1="53.2242"
        y1="29.1609"
        x2="55.6816"
        y2="33.1166"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M55.6343 33.3182L51.5435 35.4433"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default EmptyStateIllustration;
