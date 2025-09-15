import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { Strengths } from "@/types/coherence";
import cn from "@/utils/core/cn";

type Props = {
  strength: Strengths;
  disabled: boolean;
};

const colorAccent = {
  [Strengths.Low]: "orange-200",
  [Strengths.Medium]: "orange-300",
  [Strengths.High]: "orange-400",
} as const;

const LinkStrengthComponent: FC<Props> = ({ strength, disabled }) => {
  const t = useTranslations();
  const label = t(strength);
  const color = colorAccent[strength];
  const additionalStyling = `bg-${color} disabled:bg-${color} hover:bg-${color} active:bg-${color} 
  dark:bg-${color}-dark disabled:dark:bg-${color}-dark dark:hover:bg-${color} dark:active:bg-${color} 
  border-${color} dark:border-${color}-dark`;
  return (
    <Button
      className={cn(
        "text-bold mt-3 gap-1.5 rounded border px-2 py-1.5 disabled:opacity-100",
        additionalStyling
      )}
      disabled={disabled}
    >
      {label}
    </Button>
  );
};

export default LinkStrengthComponent;
