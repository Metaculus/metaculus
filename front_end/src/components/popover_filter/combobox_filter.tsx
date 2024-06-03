import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { FC, useMemo, useState } from "react";

import { FilterOption } from "@/components/popover_filter/types";
import Chip, { ChipColor } from "@/components/ui/chip";

type Props = {
  filterId: string;
  options: FilterOption[];
  onChange: (filterId: string, optionValue: string[]) => void;
  chipColor?: ChipColor;
  chipFormat?: (value: string) => string;
  shouldEnforceSearch?: boolean;
};

const ComboboxFilter: FC<Props> = ({
  filterId,
  options,
  onChange,
  chipColor,
  chipFormat,
  shouldEnforceSearch = false,
}) => {
  const [query, setQuery] = useState("");
  const activeOptions = useMemo(
    () => options.filter((o) => o.active),
    [options]
  );

  const searchedOptions = useMemo(() => {
    if (query === "") {
      return shouldEnforceSearch ? [] : options;
    }
    return options.filter((o) =>
      o.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query, shouldEnforceSearch]);

  const handleClearChipClick = (option: FilterOption) => {
    onChange(
      filterId,
      activeOptions
        .filter((activeOption) => activeOption.value !== option.value)
        .map((activeOption) => activeOption.value)
    );
  };

  return (
    <div className="relative flex w-full flex-wrap gap-2 text-metac-gray-900 dark:text-metac-gray-900-dark">
      <Combobox
        value={activeOptions}
        multiple
        immediate
        by={"value"}
        onChange={(options) => {
          onChange(
            filterId,
            options.map((o) => o.value)
          );
        }}
        onClose={() => setQuery("")}
      >
        <div className="relative w-full">
          <ComboboxInput
            className="h-8 w-full rounded border border-metac-gray-700 bg-metac-gray-0 px-2 py-1"
            placeholder="Search..."
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton className="absolute inset-y-0 right-0">
            <FontAwesomeIcon icon={faChevronDown} className="mr-2" />
          </ComboboxButton>
        </div>
        <div className="relative w-full">
          <ComboboxOptions className="border-b-1 absolute inset-x-0 -top-2 z-10 max-h-[250px] overflow-auto rounded-b rounded-l border border-metac-gray-500 bg-metac-gray-0 text-metac-gray-900 shadow-dropdown empty:hidden">
            {searchedOptions.map((o) => (
              <ComboboxOption
                key={`${filterId}-option-${o.value}`}
                value={o}
                className="m-0 cursor-pointer px-2 py-1 text-sm leading-4 text-metac-gray-900 hover:bg-metac-gray-200"
              >
                {o.label}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </div>
        {!!activeOptions.length && (
          <div className="flex flex-wrap gap-3">
            {activeOptions.map((o) => (
              <Chip
                key={`selected-chip-${filterId}-${o.value}`}
                color={chipColor}
                onClick={() => handleClearChipClick(o)}
              >
                {chipFormat?.(o.label) ?? o.label}
                <FontAwesomeIcon icon={faCircleXmark} className="ml-1" />
              </Chip>
            ))}
          </div>
        )}
      </Combobox>
    </div>
  );
};

export default ComboboxFilter;
