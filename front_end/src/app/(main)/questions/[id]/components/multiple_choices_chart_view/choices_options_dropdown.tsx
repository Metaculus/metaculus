"use client";

import { faCog } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import Checkbox from "@/components/ui/checkbox";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { ChoiceItem } from "@/types/choices";
import cn from "@/utils/core/cn";

type Props = {
  choices: ChoiceItem[];
  onChoiceChange: (choice: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
};

const ChoicesOptionsDropdown: FC<Props> = ({
  choices,
  onChoiceChange,
  onToggleAll,
}) => {
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();
  const neutralCheckboxColor = getThemeColor(METAC_COLORS.gray[500]);
  const areAllSelected = useMemo(
    () => choices.length > 0 && choices.every((choice) => choice.active),
    [choices]
  );

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <PopoverButton
            aria-label={t("settings")}
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-400 bg-transparent p-0 text-blue-700 transition-colors hover:bg-gray-100 focus:outline-none active:bg-gray-200 dark:border-blue-400-dark dark:bg-transparent dark:text-blue-700-dark dark:hover:bg-gray-100-dark dark:active:bg-gray-200-dark",
              {
                "!bg-gray-200 hover:!bg-gray-200 active:!bg-gray-200 dark:!border-white dark:!bg-white dark:!text-blue-700 dark:hover:!bg-white dark:active:!bg-white":
                  open,
              }
            )}
          >
            <FontAwesomeIcon icon={faCog} className="text-sm" />
          </PopoverButton>
          <PopoverPanel
            anchor="bottom end"
            className="z-[100] flex max-h-64 min-w-44 flex-col overflow-y-auto rounded border border-gray-500 bg-gray-0 p-1 text-sm shadow-lg [--anchor-gap:4px] dark:border-gray-500-dark dark:bg-gray-0-dark"
          >
            <Checkbox
              checked={areAllSelected}
              onChange={() => onToggleAll(!areAllSelected)}
              label={t("selectAll")}
              color={
                areAllSelected
                  ? getThemeColor(METAC_COLORS.blue[700])
                  : neutralCheckboxColor
              }
              className="gap-2 p-1.5 capitalize"
              isSolidIcon
            />
            {choices.map(({ choice, label, active, color }) => (
              <Checkbox
                key={choice}
                checked={active}
                onChange={(checked) => onChoiceChange(choice, checked)}
                label={label || choice}
                color={active ? getThemeColor(color) : neutralCheckboxColor}
                className="gap-2 p-1.5 text-sm"
                isSolidIcon
              />
            ))}
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
};

export default ChoicesOptionsDropdown;
