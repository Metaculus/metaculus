"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

export type ChamberView = "senate" | "governor";

type Props = {
  value: ChamberView;
  onChange: (value: ChamberView) => void;
  className?: string;
};

const ChamberTabs: FC<Props> = ({ value, onChange, className }) => {
  const t = useTranslations();
  const tabs: { key: ChamberView; label: string }[] = [
    { key: "senate", label: t("midtermsHubChamberSenate") },
    { key: "governor", label: t("midtermsHubChamberGovernor") },
  ];

  return (
    <div
      className={cn(
        "inline-flex overflow-visible rounded-md border border-blue-300 bg-gray-0 dark:border-blue-300-dark dark:bg-gray-0-dark",
        className
      )}
    >
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            aria-current={active ? "true" : undefined}
            onClick={() => onChange(tab.key)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-blue-200 text-blue-800 dark:bg-blue-200-dark dark:text-blue-800-dark"
                : "bg-gray-0 text-blue-700 hover:bg-blue-100 dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:bg-blue-100-dark"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default ChamberTabs;
