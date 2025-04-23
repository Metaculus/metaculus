import { FC, useMemo } from "react";

import Chip from "@/components/ui/chip";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { FilterOption } from "./types";

type Props = {
  filterId: string;
  options: FilterOption[];
  onChange: (filterId: string, optionValue: string[]) => void;
};

const MultiChipFilter: FC<Props> = ({ filterId, options, onChange }) => {
  const activeValues = useMemo(
    () => options.filter((o) => o.active).map((o) => o.value),
    [options]
  );
  const handleOptionClick = (option: FilterOption) => {
    if (option.active) {
      onChange(
        filterId,
        activeValues.filter((o) => o !== option.value)
      );
    } else {
      sendAnalyticsEvent("feedFilterActivated", {
        event_category: option.label,
      });
      onChange(filterId, [...activeValues, option.value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Chip
          key={`filter-option-${filterId}-${option.label}`}
          color={option.active ? "blueBold" : "blue"}
          onClick={() => handleOptionClick(option)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
};

export default MultiChipFilter;
