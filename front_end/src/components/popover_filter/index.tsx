import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect } from "react";

import ComboboxFilter from "@/components/popover_filter/combobox_filter";
import MultiChipFilter from "@/components/popover_filter/multi_chip_filter";
import ToggleChipFilter from "@/components/popover_filter/toggle_chip_filter";
import Button from "@/components/ui/button";
import { useBreakpoint } from "@/hooks/tailwind";

import { FilterOptionType, FilterReplaceInfo, FilterSection } from "./types";

type PanelProps = {
  open: boolean;
  fullScreenEnabled?: boolean;
  className?: string;
};

const Panel: FC<PropsWithChildren<PanelProps>> = ({
  open,
  fullScreenEnabled,
  className,
  children,
}) => {
  const isLargeScreen = useBreakpoint("sm");

  // prevent outer scroll when panel is opened in full screen mode
  useEffect(() => {
    if (!fullScreenEnabled || isLargeScreen) return;

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [fullScreenEnabled, isLargeScreen, open]);

  return (
    <PopoverPanel
      className={classNames(
        "absolute right-0 top-10 z-10 box-border flex flex-col items-start overflow-hidden overflow-y-auto rounded border border-metac-gray-300 bg-metac-gray-0 p-5 shadow-lg shadow-[#0003] dark:border-metac-gray-300-dark dark:bg-metac-gray-0-dark",
        {
          "max-sm:fixed max-sm:top-0 max-sm:z-[1300] max-sm:h-dvh max-sm:w-screen max-sm:overflow-y-auto max-sm:px-5 max-sm:pb-0 max-sm:pt-5":
            fullScreenEnabled,
        },
        className
      )}
    >
      {children}
    </PopoverPanel>
  );
};

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
  fullScreenEnabled?: boolean;
};

const PopoverFilter: FC<Props> = ({
  filters,
  buttonLabel,
  panelClassName,
  onChange,
  onClear,
  fullScreenEnabled,
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
          <Panel
            open={open}
            fullScreenEnabled={fullScreenEnabled}
            className={panelClassName}
          >
            <div className="mb-6 flex w-full items-center border-b border-metac-gray-300 sm:hidden">
              <h3 className="m-0 grow">Filter by</h3>
              <Button
                variant="text"
                size="md"
                aria-label="Close filter"
                onClick={close}
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>
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
            <div className="ml-auto mt-4 flex w-full justify-end gap-3 border-t border-metac-gray-300 pt-4 dark:border-metac-gray-300-dark max-sm:sticky max-sm:bottom-0 max-sm:w-full max-sm:bg-metac-gray-0 max-sm:py-4 max-sm:dark:bg-metac-gray-0-dark">
              <Button onClick={onClear}>{t("Clear")}</Button>
              <Button variant="primary" onClick={close}>
                {t("Done")}
              </Button>
            </div>
          </Panel>
        </>
      )}
    </Popover>
  );
};

export default PopoverFilter;
