"use client";

import {
  faFileLines,
  faTableCellsLarge,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useOptimistic, useTransition } from "react";

import cn from "@/utils/core/cn";

import { DEFAULT_GHM_MODE, GHM_MODES, GhmMode } from "../helpers/mode";

const MODE_OPTIONS = {
  full: { labelKey: "globalHealthMonitorModeFull", icon: faTableCellsLarge },
  simple: { labelKey: "globalHealthMonitorModeSimple", icon: faFileLines },
} as const;

export function ModeSwitcher({ mode }: { mode: GhmMode }) {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [optimisticMode, setOptimisticMode] = useOptimistic(mode);
  const [, setMode] = useQueryState(
    "mode",
    parseAsStringLiteral(GHM_MODES).withOptions({
      shallow: false,
      scroll: false,
      history: "push",
      startTransition,
    })
  );

  const selectMode = (option: GhmMode) => {
    if (option === optimisticMode) {
      return;
    }
    startTransition(async () => {
      setOptimisticMode(option);
      await setMode(option === DEFAULT_GHM_MODE ? null : option);
    });
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("globalHealthMonitorModeLabel")}
      aria-busy={isPending}
      className="inline-flex shrink-0 rounded-full border border-blue-400 bg-gray-0 p-1 dark:border-blue-400-dark dark:bg-gray-0-dark print:hidden"
    >
      {GHM_MODES.map((option) => {
        const isActive = option === optimisticMode;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => selectMode(option)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
                : "text-blue-700 hover:bg-blue-200 dark:text-blue-700-dark dark:hover:bg-blue-200-dark",
              isActive && isPending && "opacity-70"
            )}
          >
            <FontAwesomeIcon
              icon={MODE_OPTIONS[option].icon}
              className="size-3"
            />
            {t(MODE_OPTIONS[option].labelKey)}
          </button>
        );
      })}
    </div>
  );
}
