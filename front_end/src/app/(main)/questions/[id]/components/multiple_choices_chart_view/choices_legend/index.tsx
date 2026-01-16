import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import ChoiceCheckbox from "@/components/choice_checkbox";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import useAppTheme from "@/hooks/use_app_theme";
import { ChoiceItem } from "@/types/choices";
import cn from "@/utils/core/cn";

type Props = {
  choices: ChoiceItem[];
  currentOptions?: string[];
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  maxLegendChoices: number;
  othersToggle?: boolean;
  onOthersToggle?: (checked: boolean) => void;
  othersDisabled?: boolean;
};

const ChoicesLegend: FC<Props> = ({
  choices,
  currentOptions,
  onChoiceChange,
  onChoiceHighlight,
  onToggleAll,
  maxLegendChoices,
  othersToggle,
  onOthersToggle,
  othersDisabled,
}) => {
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();
  const mcMode = typeof othersToggle === "boolean" && !!onOthersToggle;
  const currentOptionNames = useMemo(
    () => new Set(currentOptions ?? []),
    [currentOptions]
  );

  const { legendChoices, dropdownChoices } = useMemo(() => {
    const left = choices.slice(0, maxLegendChoices);
    const right = choices.slice(maxLegendChoices);
    if (mcMode) {
      const leftOff = left.filter((c) => !c.active);
      return { legendChoices: left, dropdownChoices: [...leftOff, ...right] };
    }
    return { legendChoices: left, dropdownChoices: right };
  }, [choices, maxLegendChoices, mcMode]);

  const areAllSelected = useMemo(() => {
    const selectedCount = choices.reduce(
      (acc, item) => acc + Number(item.active),
      0
    );
    return selectedCount === choices.length;
  }, [choices]);

  const othersText = useMemo(
    () => t("othersCount", { count: dropdownChoices.length }),
    [t, dropdownChoices.length]
  );

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-[14px] text-xs font-normal">
      {legendChoices.map(({ choice, color, active }, idx) => {
        const isDeleted = currentOptions && !currentOptionNames.has(choice);
        const label = isDeleted ? `${choice} (deleted)` : choice;

        return (
          <ChoiceCheckbox
            key={`multiple-choice-legend-${choice}-${idx}`}
            label={label}
            color={color.DEFAULT}
            checked={active}
            onChange={(checked) => onChoiceChange(choice, checked)}
            onHighlight={(highlighted) => onChoiceHighlight(choice, highlighted)}
          />
        );
      })}
      {!!dropdownChoices.length && (
        <div className="flex items-center gap-1 md:ml-auto">
          {mcMode && (
            <Checkbox
              checked={!!othersToggle}
              onChange={() =>
                !othersDisabled &&
                onOthersToggle &&
                onOthersToggle(!othersToggle)
              }
              label={othersText}
              className={cn("p-1.5", {
                "pointer-events-none opacity-35": othersDisabled,
              })}
            />
          )}
          <Popover className="relative">
            {({ open }) => (
              <>
                {!mcMode ? (
                  <PopoverButton
                    as={Button}
                    variant="text"
                    size="xs"
                    className={cn("px-1.5 py-1 focus:outline-none", {
                      "bg-gray-300 dark:bg-gray-300-dark": open,
                    })}
                  >
                    {othersText}
                    <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
                  </PopoverButton>
                ) : (
                  <PopoverButton
                    className={cn(
                      "rounded px-1.5 py-1 text-gray-700 hover:bg-gray-300 dark:text-gray-700-dark dark:hover:bg-gray-300-dark",
                      { "bg-gray-300 dark:bg-gray-300-dark": open }
                    )}
                  >
                    <FontAwesomeIcon icon={faChevronDown} />
                  </PopoverButton>
                )}
                <PopoverPanel
                  anchor="bottom"
                  className="z-100 flex max-h-48 w-max flex-col overflow-y-auto rounded border border-gray-300 bg-gray-0 p-1 text-xs [--anchor-gap:4px] dark:border-gray-300-dark dark:bg-gray-0-dark"
                >
                  <Checkbox
                    checked={areAllSelected}
                    onChange={() => onToggleAll(areAllSelected)}
                    label={areAllSelected ? t("deselectAll") : t("selectAll")}
                    className="p-1.5 capitalize"
                  />
                  {dropdownChoices.map(({ choice, color, active }, idx) => {
                    const isDeleted =
                      currentOptions && !currentOptionNames.has(choice);
                    const label = isDeleted ? `${choice} (deleted)` : choice;

                    return (
                      <ChoiceCheckbox
                        key={`multiple-choice-dropdown-${choice}-${idx}`}
                        label={label}
                        color={getThemeColor(color)}
                        checked={active}
                        onChange={(checked) => onChoiceChange(choice, checked)}
                        onHighlight={(highlighted) =>
                          onChoiceHighlight(choice, highlighted)
                        }
                        className="p-1.5"
                      />
                    );
                  })}
                </PopoverPanel>
              </>
            )}
          </Popover>
        </div>
      )}
    </div>
  );
};

export default ChoicesLegend;
