"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  getMcOptionColor,
  MC_OPTION_PALETTE_KEYS,
  METAC_COLORS,
} from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";

type Props = {
  value: string | null | undefined;
  onChange: (key: string | null) => void;
  fallback?: ThemeColor;
};

const ColorPicker: FC<Props> = ({ value, onChange, fallback }) => {
  const t = useTranslations();
  const { getThemeColor } = useAppTheme();

  const currentColor =
    getMcOptionColor(value) ?? fallback ?? METAC_COLORS.gray["400"];

  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        title={t("optionColor")}
        aria-label={t("optionColor")}
        className="block size-6 shrink-0 rounded border border-gray-500 dark:border-gray-500-dark"
        style={{ backgroundColor: getThemeColor(currentColor) }}
      />
      <PopoverPanel
        portal
        anchor="bottom start"
        className="z-[100] grid grid-cols-6 gap-1 rounded border border-gray-300 bg-gray-0 p-2 shadow-lg dark:border-gray-300-dark dark:bg-gray-0-dark"
      >
        {({ close }) => (
          <>
            {MC_OPTION_PALETTE_KEYS.map((key) => {
              const color = getMcOptionColor(key);
              if (!color) return null;

              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    "size-6 rounded border border-transparent",
                    key === value &&
                      "ring-2 ring-blue-700 ring-offset-1 dark:ring-blue-700-dark"
                  )}
                  style={{ backgroundColor: getThemeColor(color) }}
                  onClick={() => {
                    onChange(key);
                    close();
                  }}
                />
              );
            })}
            <button
              type="button"
              title={t("defaultColor")}
              aria-label={t("defaultColor")}
              className="flex size-6 items-center justify-center rounded border border-gray-500 text-gray-600 dark:border-gray-500-dark dark:text-gray-600-dark"
              onClick={() => {
                onChange(null);
                close();
              }}
            >
              <FontAwesomeIcon icon={faXmark} size="sm" />
            </button>
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
};

export default ColorPicker;
