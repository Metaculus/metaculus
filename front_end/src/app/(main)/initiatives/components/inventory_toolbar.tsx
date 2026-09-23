"use client";

import { useTranslations } from "next-intl";
import { FC, Ref } from "react";

import cn from "@/utils/core/cn";

import { GridViewIcon, ListViewIcon } from "./inventory_view_icons";
import { InitiativesInventoryFilter, InitiativesInventoryView } from "../types";

const VIEW_OPTIONS = [
  {
    value: "list",
    labelKey: "initiativesInventoryViewList",
    Icon: ListViewIcon,
  },
  {
    value: "grid",
    labelKey: "initiativesInventoryViewGrid",
    Icon: GridViewIcon,
  },
] as const;

type Props = {
  filters: InitiativesInventoryFilter[];
  activeFilterId: string;
  onFilterChange: (filterId: string) => void;
  view: InitiativesInventoryView;
  onViewChange: (view: InitiativesInventoryView) => void;
  resultsId?: string;
  showFilters?: boolean;
  containerRef?: Ref<HTMLDivElement>;
  className?: string;
};

const InventoryToolbar: FC<Props> = ({
  filters,
  activeFilterId,
  onFilterChange,
  view,
  onViewChange,
  resultsId,
  showFilters = true,
  containerRef,
  className,
}) => {
  const t = useTranslations();

  return (
    <div
      ref={containerRef}
      className={cn("flex items-center max-[768px]:gap-3", className)}
    >
      {showFilters && (
        <div className="min-w-0 flex-1 overflow-x-auto pb-[3px] no-scrollbar">
          <div
            role="group"
            aria-label={t("initiativesInventoryFilterLabel")}
            className="flex w-max min-w-full gap-4 border-b border-[var(--inventory-line)] [--inventory-line:#C8D3D7] dark:[--inventory-line:theme(colors.blue.400.dark)] min-[769px]:[border-image:linear-gradient(to_right,var(--inventory-line)_calc(100%-83px),transparent_calc(100%-33px))_1]"
          >
            {filters.map(({ id, labelKey }) => {
              const isActive = id === activeFilterId;

              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={isActive}
                  aria-controls={resultsId}
                  onClick={() => onFilterChange(id)}
                  className={cn(
                    "-mb-[3px] shrink-0 whitespace-nowrap border-b-2 py-4 font-sans text-sm font-medium not-italic leading-[14px] text-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-800 dark:text-blue-800-dark dark:focus-visible:ring-blue-800-dark",
                    isActive
                      ? "border-blue-900 dark:border-blue-900-dark"
                      : "border-transparent hover:border-blue-500 dark:hover:border-blue-500-dark"
                  )}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        role="group"
        aria-label={t("initiativesInventoryViewLabel")}
        className="ml-auto flex shrink-0 items-start rounded-lg border border-[#C8D3D7] bg-[#F8FDFD] p-[3px] dark:border-blue-400-dark dark:bg-blue-100-dark"
      >
        {VIEW_OPTIONS.map(({ value, labelKey, Icon }) => {
          const isActive = value === view;

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              aria-controls={resultsId}
              onClick={() => onViewChange(value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium leading-[12.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 dark:focus-visible:ring-blue-800-dark",
                isActive
                  ? "bg-blue-900 text-gray-0 dark:bg-blue-900-dark dark:text-gray-0-dark"
                  : "text-blue-900 hover:bg-blue-200 dark:text-blue-900-dark dark:hover:bg-blue-200-dark"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="max-md:sr-only">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryToolbar;
