import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect } from "react";

import ComboboxFilter from "@/components/popover_filter/combobox_filter";
import MultiChipFilter from "@/components/popover_filter/multi_chip_filter";
import ToggleChipFilter from "@/components/popover_filter/toggle_chip_filter";
import Button from "@/components/ui/button";
import { useBreakpoint } from "@/hooks/tailwind";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

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
      className={cn(
        "absolute right-0 top-10 z-[100] box-border flex flex-col items-start overflow-hidden overflow-y-auto rounded border border-gray-300 bg-gray-0 p-5 shadow-lg shadow-[#0003] dark:border-gray-300-dark dark:bg-gray-0-dark",
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
    replaceInfo?: FilterReplaceInfo,
    extraValues?: Record<string, string>
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

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <PopoverButton
            as={Button}
            className={cn({
              "bg-gray-300 dark:bg-gray-300-dark": open,
            })}
            onClick={() =>
              sendAnalyticsEvent("feedFilterClick", {
                event_category: new URLSearchParams(
                  window.location.search
                ).toString(),
              })
            }
          >
            {buttonLabel || t("Filter")}
          </PopoverButton>
          <Panel
            open={open}
            fullScreenEnabled={fullScreenEnabled}
            className={panelClassName}
          >
            <div className="mb-6 flex w-full items-center border-b border-gray-300 sm:hidden">
              <h3 className="m-0 grow capitalize">{t("filterBy")}</h3>
              <Button
                variant="text"
                size="md"
                aria-label={t("closeFilter")}
                onClick={close}
              >
                <FontAwesomeIcon icon={faXmark} />
              </Button>
            </div>
            <div className="flex w-full flex-col gap-4">
              {filters.map((filter) => (
                <div key={`filter-${filter.id}`}>
                  <h3 className="mb-2 mt-0 w-full text-xs font-bold uppercase leading-3 text-gray-700 dark:text-gray-700-dark">
                    {filter.title}
                  </h3>
                  {filter.type === FilterOptionType.MultiChip && (
                    <MultiChipFilter
                      filterId={filter.id}
                      options={filter.options}
                      onChange={onChange}
                    />
                  )}
                  {filter.type === FilterOptionType.Combobox && (
                    <ComboboxFilter
                      filterId={filter.id}
                      options={filter.options}
                      optionsFetcher={filter.optionsFetcher}
                      onChange={onChange}
                      chipColor={filter.chipColor}
                      chipFormat={filter.chipFormat}
                      shouldEnforceSearch={filter.shouldEnforceSearch}
                      multiple={filter.multiple}
                    />
                  )}
                  {filter.type === FilterOptionType.ToggleChip && (
                    <ToggleChipFilter
                      filterId={filter.id}
                      options={filter.options}
                      onChange={onChange}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="ml-auto mt-4 flex w-full justify-end gap-3 border-t border-gray-300 pt-4 dark:border-gray-300-dark max-sm:sticky max-sm:bottom-0 max-sm:w-full max-sm:bg-gray-0 max-sm:py-4 max-sm:dark:bg-gray-0-dark">
              <Button className="capitalize" onClick={onClear}>
                {t("clear")}
              </Button>
              <Button className="capitalize" variant="primary" onClick={close}>
                {t("done")}
              </Button>
            </div>
          </Panel>
        </>
      )}
    </Popover>
  );
};

export default PopoverFilter;
