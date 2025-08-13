import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import ChoiceCheckbox from "@/components/choice_checkbox";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { ChoiceItem } from "@/types/choices";
import cn from "@/utils/core/cn";

type Props = {
  choices: ChoiceItem[];
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  maxLegendChoices: number;
};

const ChoicesLegend: FC<Props> = ({
  choices,
  onChoiceChange,
  onChoiceHighlight,
  onToggleAll,
  maxLegendChoices,
}) => {
  const t = useTranslations();
  const { legendChoices, dropdownChoices } = useMemo(
    () => ({
      legendChoices: choices.slice(0, maxLegendChoices),
      dropdownChoices: choices.slice(maxLegendChoices),
    }),
    [choices, maxLegendChoices]
  );

  const areAllSelected = useMemo(() => {
    const selectedCount = choices.reduce(
      (acc, item) => acc + Number(item.active),
      0
    );

    return selectedCount === choices.length;
  }, [choices]);

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-[14px] text-xs font-normal">
      {legendChoices.map(({ choice, color, active }, idx) => (
        <ChoiceCheckbox
          key={`multiple-choice-legend-${choice}-${idx}`}
          label={choice}
          color={color.DEFAULT}
          checked={active}
          onChange={(checked) => onChoiceChange(choice, checked)}
          onHighlight={(highlighted) => onChoiceHighlight(choice, highlighted)}
        />
      ))}
      {!!dropdownChoices.length && (
        <Popover className="relative md:ml-auto">
          {({ open }) => (
            <>
              <PopoverButton
                as={Button}
                variant="text"
                size="xs"
                className={cn("focus:outline-none", {
                  "bg-gray-300 dark:bg-gray-300-dark": open,
                })}
              >
                {t("othersCount", { count: dropdownChoices.length })}
                <FontAwesomeIcon icon={faChevronDown} className="ml-1" />
              </PopoverButton>
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
                {dropdownChoices.map(({ choice, color, active }, idx) => (
                  <ChoiceCheckbox
                    key={`multiple-choice-dropdown-${choice}-${idx}`}
                    label={choice}
                    color={color.DEFAULT}
                    checked={active}
                    onChange={(checked) => onChoiceChange(choice, checked)}
                    onHighlight={(highlighted) =>
                      onChoiceHighlight(choice, highlighted)
                    }
                    className="p-1.5"
                  />
                ))}
              </PopoverPanel>
            </>
          )}
        </Popover>
      )}
    </div>
  );
};

export default ChoicesLegend;
