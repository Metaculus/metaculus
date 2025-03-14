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
import { debounce } from "lodash";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import { FilterOption } from "@/components/popover_filter/types";
import Chip, { ChipColor } from "@/components/ui/chip";

type Props = {
  filterId: string;
  options: FilterOption[];
  optionsFetcher?: (query: string) => Promise<FilterOption[]>;
  onChange: (filterId: string, optionValue: string[]) => void;
  chipColor?: ChipColor;
  chipFormat?: (value: string) => string;
  shouldEnforceSearch?: boolean;
  multiple?: boolean;
};

const ComboboxFilter: FC<Props> = ({
  filterId,
  options,
  optionsFetcher,
  onChange,
  chipColor,
  chipFormat,
  shouldEnforceSearch = false,
  multiple = true,
}) => {
  const [query, setQuery] = useState("");
  const activeOptions = useMemo(
    () => options.filter((o) => o.active),
    [options]
  );
  const [searchedOptions, setSearchedOptions] = useState<FilterOption[]>([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchOptions = useCallback(
    debounce((q) => {
      if (optionsFetcher) optionsFetcher(q).then(setSearchedOptions);
    }, 200),
    [optionsFetcher]
  );

  useEffect(() => {
    if (query === "") {
      setSearchedOptions(shouldEnforceSearch ? [] : options || []);
    } else if (optionsFetcher) {
      fetchOptions(query);
    } else {
      setSearchedOptions(
        options.filter((o) =>
          o.label.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [fetchOptions, options, optionsFetcher, query, shouldEnforceSearch]);

  const handleClearChipClick = (option: FilterOption) => {
    onChange(
      filterId,
      activeOptions
        .filter((activeOption) => activeOption.value !== option.value)
        .map((activeOption) => activeOption.value)
    );
  };

  const comboboxChildren = (
    <>
      <div className="relative w-full">
        <ComboboxInput
          className="h-8 w-full rounded border border-gray-700 bg-gray-0 px-2 py-1 dark:border-gray-700-dark dark:bg-gray-0-dark"
          placeholder="Search..."
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxButton className="absolute inset-y-0 right-0">
          <FontAwesomeIcon icon={faChevronDown} className="mr-2" />
        </ComboboxButton>
      </div>
      <div className="relative w-full">
        <ComboboxOptions className="border-b-1 absolute inset-x-0 -top-2 z-10 max-h-[250px] overflow-auto rounded-b rounded-l border border-gray-500 bg-gray-0 text-gray-900 shadow-dropdown empty:hidden dark:border-gray-500-dark dark:bg-gray-0-dark">
          {searchedOptions.map((o) => (
            <ComboboxOption
              key={`${filterId}-option-${o.value}`}
              value={o}
              className="m-0 cursor-pointer px-2 py-1 text-sm leading-4 text-gray-900 hover:bg-gray-200 dark:text-gray-900-dark dark:hover:bg-gray-200-dark"
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
    </>
  );

  return (
    <div className="relative flex w-full flex-wrap gap-2 text-gray-900 dark:text-gray-900-dark">
      {/* 
        Have to do this workaround because of issue with props 
        https://github.com/tailwindlabs/headlessui/issues/2438
      */}
      {multiple ? (
        <Combobox
          value={activeOptions}
          multiple
          immediate
          by={"value"}
          onChange={(selectedOptions) => {
            onChange(
              filterId,
              selectedOptions.map((o) => o.value)
            );
          }}
          onClose={() => setQuery("")}
        >
          {comboboxChildren}
        </Combobox>
      ) : (
        <Combobox
          value={activeOptions}
          immediate
          onChange={(selectedOption) => {
            // when multiple is false, selectedOption is a single option
            const option = selectedOption as unknown as FilterOption;
            onChange(filterId, option ? [option.value] : []);
          }}
          onClose={() => setQuery("")}
        >
          {comboboxChildren}
        </Combobox>
      )}
    </div>
  );
};

export default ComboboxFilter;
