"use client";

import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useOptimistic, useTransition } from "react";

import cn from "@/utils/core/cn";

import { DEFAULT_GHM_MODE, GHM_MODES, GhmMode } from "../helpers/mode";

const MODE_LABEL_KEYS = {
  full: "globalHealthMonitorModeFull",
  simple: "globalHealthMonitorModeSimple",
} as const;

// Temporary: lets reviewers compare the two layouts. Styled as a preview strip, not as
// part of the page.
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
      className="mx-3 mb-2 mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded border border-dashed border-gray-500 px-3 py-1 text-xs text-gray-600 dark:border-gray-500-dark dark:text-gray-600-dark xl:mx-0 xl:mt-0 print:hidden"
    >
      <span className="font-medium uppercase tracking-wide">
        {t("globalHealthMonitorModePreview")}
      </span>
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
              "rounded-sm px-1 underline-offset-2",
              isActive
                ? "font-bold text-gray-800 underline dark:text-gray-800-dark"
                : "hover:underline",
              isActive && isPending && "opacity-70"
            )}
          >
            {t(MODE_LABEL_KEYS[option])}
          </button>
        );
      })}
    </div>
  );
}
