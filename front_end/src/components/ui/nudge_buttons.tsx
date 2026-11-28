import { faCaretDown, faCaretUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

const SHIFT_NUDGE_MULTIPLIER = 5;

export function nudgeSteps(direction: 1 | -1, shiftKey: boolean): number {
  return direction * (shiftKey ? SHIFT_NUDGE_MULTIPLIER : 1);
}

type Props = {
  onNudge: (steps: number) => void;
  className?: string;
};

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
          // Don't take focus from an input being edited
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
