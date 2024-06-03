import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ComboboxFilter from "@/components/popover_filter/combobox_filter";
import MultiChipFilter from "@/components/popover_filter/multi_chip_filter";
import ToggleChipFilter from "@/components/popover_filter/toggle_chip_filter";
import Button from "@/components/ui/button";

import { FilterOptionType, FilterReplaceInfo, FilterSection } from "./types";

type Props = {
  filters: FilterSection[];
  buttonLabel?: string;
  panelClassName?: string;
  onChange: (
    filterId: string,
    optionValue: string | string[] | null,
    replaceInfo?: FilterReplaceInfo
  ) => void;
  onClear: () => void;
};

const PopoverFilter: FC<Props> = ({
  filters,
  buttonLabel,
  panelClassName,
  onChange,
  onClear,
}) => {
  const t = useTranslations();

  const renderFilter = (filter: FilterSection) => {
    switch (filter.type) {
      case FilterOptionType.MultiChip:
        return (
          <MultiChipFilter
            filterId={filter.id}
            options={filter.options}
            onChange={onChange}
          />
        );
      case FilterOptionType.Combobox:
        return (
          <ComboboxFilter
            filterId={filter.id}
            options={filter.options}
            onChange={onChange}
            chipColor={filter.chipColor}
            chipFormat={filter.chipFormat}
            shouldEnforceSearch={filter.shouldEnforceSearch}
          />
        );
      case FilterOptionType.ToggleChip:
        return (
          <ToggleChipFilter
            filterId={filter.id}
            options={filter.options}
            onChange={onChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <PopoverButton
            as={Button}
            className={classNames({
              "bg-metac-gray-300 dark:bg-metac-gray-300-dark": open,
            })}
          >
            {buttonLabel || t("Filter")}
          </PopoverButton>
          <PopoverPanel
            className={classNames(
              "absolute right-0 top-10 z-10 box-border flex min-h-96 flex-col items-start overflow-hidden overflow-y-auto rounded border border-metac-gray-300 bg-metac-gray-0 p-5 shadow-lg shadow-[#0003] dark:border-metac-gray-300-dark dark:bg-metac-gray-0-dark",
              panelClassName
            )}
          >
            <div className="flex w-full flex-col gap-4">
              {filters.map((filter) => (
                <div key={`filter-${filter.id}`}>
                  <h3 className="mb-2 mt-0 w-full text-xs font-bold uppercase leading-3 text-metac-gray-700 dark:text-metac-gray-700-dark">
                    {filter.title}
                  </h3>
                  {renderFilter(filter)}
                </div>
              ))}
            </div>
            <div className="ml-auto mt-4 flex w-full justify-end gap-3 border-t border-metac-gray-300 pt-4 max-sm:sticky max-sm:bottom-0 max-sm:w-full max-sm:bg-metac-gray-0 max-sm:py-4 dark:border-metac-gray-300-dark max-sm:dark:bg-metac-gray-0-dark">
              <Button onClick={onClear}>{t("Clear")}</Button>
              <Button variant="primary" onClick={close}>
                {t("Done")}
              </Button>
            </div>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default PopoverFilter;
