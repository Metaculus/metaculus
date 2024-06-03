import { FC } from "react";

import {
  FilterOption,
  FilterReplaceInfo,
} from "@/components/popover_filter/types";
import Chip from "@/components/ui/chip";

type Props = {
  filterId: string;
  options: FilterOption[];
  onChange: (
    filterId: string,
    optionValue: string | null,
    replaceInfo?: FilterReplaceInfo
  ) => void;
};

const ToggleChipFilter: FC<Props> = ({ filterId, options, onChange }) => {
  const handleOptionClick = (option: FilterOption) => {
    const replaceInfo = option.id
      ? {
          optionId: option.id,
          replaceIds: options.map((o) => o.id).filter((id) => !!id) as string[],
        }
      : undefined;

    if (option.active) {
      onChange(filterId, null, replaceInfo);
    } else {
      onChange(filterId, option.value, replaceInfo);
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
