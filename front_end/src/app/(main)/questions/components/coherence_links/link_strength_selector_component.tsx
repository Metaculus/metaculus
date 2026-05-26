import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { STRENGTH_TIERS } from "@/types/coherence";
import cn from "@/utils/core/cn";

type Props = {
  onSelect: (strength: number) => void;
};

const LinkStrengthSelectorComponent: FC<Props> = ({ onSelect }) => {
  const t = useTranslations();
  const [currentStrength, setCurrentStrength] = useState<number>(2);
  const valueSelected = (value: number) => {
    onSelect(value);
    setCurrentStrength(value);
  };
  return (
    <div className="flex items-center gap-2">
      {STRENGTH_TIERS.map((tier) => {
        const selected = tier.value === currentStrength;
        return (
          <button
            key={tier.value}
            type="button"
            onClick={() => valueSelected(tier.value)}
            className={cn(
              "flex-1 rounded border border-gray-300 px-3 py-2 text-sm capitalize transition-colors dark:border-gray-300-dark",
              selected
                ? "bg-gray-200 font-semibold dark:bg-gray-200-dark"
                : "hover:bg-gray-100 dark:hover:bg-gray-100-dark"
            )}
          >
            {t(tier.label)}
          </button>
        );
      })}
    </div>
  );
};

export default LinkStrengthSelectorComponent;
