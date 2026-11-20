import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

// Holding Shift nudges this many times as far
const SHIFT_NUDGE_MULTIPLIER = 5;

/** Signed number of nudge steps for a press: ±1, or ±5 with Shift */
export function nudgeSteps(direction: 1 | -1, shiftKey: boolean): number {
  return direction * (shiftKey ? SHIFT_NUDGE_MULTIPLIER : 1);
}

type Props = {
  // Called with a signed number of steps (see nudgeSteps)
  onNudge: (steps: number) => void;
  className?: string;
};

/**
 * Small stacked up/down buttons for nudging an input's value, meant to sit
 * inside the input's right edge. They don't take focus (mousedown is
 * prevented), so an input being edited stays focused; the arrow keys cover
 * keyboard use. Shift-click nudges further, like Shift with the keys.
 */
const NudgeButtons: FC<Props> = ({ onNudge, className }) => {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "absolute right-0.5 top-1/2 flex -translate-y-1/2 flex-col",
        className
      )}
    >
      {(
        [
          [1, faCaretUp, t("nudgeUp")],
          [-1, faCaretDown, t("nudgeDown")],
        ] as const
      ).map(([direction, icon, label]) => (
        <button
          key={direction}
          type="button"
          tabIndex={-1}
          aria-label={label}
          title={label}
          className="flex h-3 w-4 items-center justify-center rounded-sm text-[10px] leading-none text-gray-600 hover:bg-gray-300 hover:text-gray-900 dark:text-gray-600-dark dark:hover:bg-gray-300-dark dark:hover:text-gray-900-dark"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => onNudge(nudgeSteps(direction, e.shiftKey))}
        >
          <FontAwesomeIcon icon={icon} />
        </button>
      ))}
    </div>
  );
};

export default NudgeButtons;
