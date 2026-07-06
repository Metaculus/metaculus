import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import ChoiceCheckbox from "@/components/choice_checkbox";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import useAppTheme from "@/hooks/use_app_theme";
import { ChoiceItem } from "@/types/choices";
import cn from "@/utils/core/cn";
import { truncateLabel } from "@/utils/formatters/string";

type Props = {
  choices: ChoiceItem[];
  onChoiceChange: (choice: string, checked: boolean) => void;
  onChoiceHighlight: (choice: string, highlighted: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  othersToggle?: boolean;
  onOthersToggle?: (checked: boolean) => void;
  othersDisabled?: boolean;
};

const ChoicesLegend: FC<Props> = ({
  choices,
  onChoiceChange,
  onChoiceHighlight,
  onToggleAll,
  othersToggle,
  onOthersToggle,
  othersDisabled,
}) => {
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();
  const mcMode = typeof othersToggle === "boolean" && !!onOthersToggle;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [pinnedChoices, setPinnedChoices] = useState<Set<string>>(
    () => new Set(choices.filter((c) => c.active).map((c) => c.choice))
  );
  useEffect(() => {
    if (isDropdownOpen) return;
    setPinnedChoices((prev) => {
      const next = new Set(prev);
      let changed = false;
      choices.forEach((c) => {
        if (c.active && !next.has(c.choice)) {
          next.add(c.choice);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [choices, isDropdownOpen]);

  const { legendChoices, dropdownChoices } = useMemo(
    () => ({
      legendChoices: choices.filter((c) => pinnedChoices.has(c.choice)),
      dropdownChoices: choices.filter((c) => !pinnedChoices.has(c.choice)),
    }),
    [choices, pinnedChoices]
  );

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

  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setIsDropdownOpen(open);
  }, []);

  return (
    <div className="relative flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs font-normal">
      {legendChoices.map(({ label, choice, color, active }, idx) => (
        <ChoiceCheckbox
          key={`multiple-choice-legend-${choice}-${idx}`}
          label={truncateLabel(label || choice, 30)}
          color={color.DEFAULT}
          checked={active}
          onChange={(checked) => onChoiceChange(choice, checked)}
          onHighlight={(highlighted) => onChoiceHighlight(choice, highlighted)}
        />
      ))}
      {!!dropdownChoices.length && (
        <div className="flex items-center gap-1">
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
                <PopoverOpenSync
                  open={open}
                  onChange={handleDropdownOpenChange}
                />
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
                  {dropdownChoices.map(
                    ({ label, choice, color, active }, idx) => (
                      <ChoiceCheckbox
                        key={`multiple-choice-dropdown-${choice}-${idx}`}
                        label={label || choice}
                        color={getThemeColor(color)}
                        checked={active}
                        onChange={(checked) => onChoiceChange(choice, checked)}
                        onHighlight={(highlighted) =>
                          onChoiceHighlight(choice, highlighted)
                        }
                        className="p-1.5"
                      />
                    )
                  )}
                </PopoverPanel>
              </>
            )}
          </Popover>
        </div>
      )}
    </div>
  );
};

const PopoverOpenSync: FC<{
  open: boolean;
  onChange: (open: boolean) => void;
}> = ({ open, onChange }) => {
  useEffect(() => {
    onChange(open);
  }, [open, onChange]);
  return null;
};

export default ChoicesLegend;
