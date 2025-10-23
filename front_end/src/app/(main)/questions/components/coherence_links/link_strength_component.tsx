import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { Strengths } from "@/types/coherence";
import { convertStrengthNumberToLabel } from "@/utils/coherence";
import cn from "@/utils/core/cn";

type Props = {
  strength: number;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

// Note: cannot be generated dynamically because Tailwind doesn't generate the classes
const colorAccent = {
  [Strengths.Low]: `bg-orange-200 disabled:bg-orange-200 hover:bg-orange-200 active:bg-orange-200 
  dark:bg-orange-200-dark disabled:dark:bg-orange-200-dark dark:hover:bg-orange-200-dark dark:active:bg-orange-200-dark
  border-orange-200 dark:border-orange-200-dark`,
  [Strengths.Medium]: `bg-orange-300 disabled:bg-orange-300 hover:bg-orange-300 active:bg-orange-300 
  dark:bg-orange-300-dark disabled:dark:bg-orange-300-dark dark:hover:bg-orange-300-dark dark:active:bg-orange-300-dark
  border-orange-300 dark:border-orange-300-dark`,
  [Strengths.High]: `bg-orange-400 disabled:bg-orange-400 hover:bg-orange-400 active:bg-orange-400 
  dark:bg-orange-400-dark disabled:dark:bg-orange-400-dark dark:hover:bg-orange-400-dark dark:active:bg-orange-40-dark 
  border-orange-400 dark:border-orange-400-dark`,
} as const;

const strengthI18nKey: Record<Strengths, keyof IntlMessages> = {
  [Strengths.Low]: "lowStrength",
  [Strengths.Medium]: "mediumStrength",
  [Strengths.High]: "highStrength",
};

const LinkStrengthComponent: FC<Props> = ({
  strength,
  disabled,
  onClick,
  selected,
}) => {
  const t = useTranslations();
  const strengthLabel = convertStrengthNumberToLabel(strength);
  if (!strengthLabel) return null;
  const label = t(strengthI18nKey[strengthLabel]);
  const additionalStyling = colorAccent[strengthLabel];
  return (
    <Button
      className={cn(
        "text-bold w-32 gap-1.5 rounded border-2 p-1 pb-1.5 pt-1.5 disabled:opacity-100",
        additionalStyling,
        selected
          ? "ring-2 ring-gray-100 ring-offset-2 ring-offset-gray-700 dark:ring-gray-100-dark dark:ring-offset-gray-700-dark"
          : ""
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export default LinkStrengthComponent;
