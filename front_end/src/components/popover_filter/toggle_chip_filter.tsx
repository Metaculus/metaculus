import { FC } from "react";

import {
  FilterReplaceInfo,
  ToggleFilterOption,
} from "@/components/popover_filter/types";
import Chip from "@/components/ui/chip";

type Props = {
  filterId: string;
  options: ToggleFilterOption[];
  onChange: (
    filterId: string,
    optionValue: string | null,
    replaceInfo?: FilterReplaceInfo,
    extraValues?: Record<string, string>
  ) => void;
};

const ToggleChipFilter: FC<Props> = ({ filterId, options, onChange }) => {
  const handleOptionClick = (option: ToggleFilterOption) => {
    const replaceInfo = option.id
      ? {
          optionId: option.id,
          replaceIds: option.isPersisted
            ? [] // don't remove other filters when toggling persisted option
            : (options
                .filter((o) => {
                  if (!o.id) {
                    return false;
                  }

                  // don't remove persisted filters when toggling other filters
                  if (o.isPersisted) {
                    return false;
                  }

                  return true;
                })
                .map((o) => o.id) as string[]),
        }
      : undefined;

    if (option.active) {
      onChange(filterId, null, replaceInfo, option.extraValues);
    } else {
      onChange(filterId, option.value, replaceInfo, option.extraValues);
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

export default ToggleChipFilter;
