"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { GroupChartViewMode } from "./consumer_list_chart_shell";

type Props = {
  value: GroupChartViewMode;
  onChange: (mode: GroupChartViewMode) => void;
  className?: string;
};

const GroupChartViewTabs: FC<Props> = ({ value, onChange, className }) => {
  const t = useTranslations();

  const buttons: { value: GroupChartViewMode; label: string }[] = [
    { value: "timeline", label: t("timeline") },
    { value: "distributions", label: t("distributions") },
  ];

  return (
    <div className={cn("flex gap-2", className)}>
      {buttons.map(({ value: buttonValue, label }) => (
        <Button
          key={buttonValue}
          onClick={() => onChange(buttonValue)}
          className={cn(
            "h-6 rounded border-0 px-1 py-0.5 text-sm font-normal leading-4",
            value === buttonValue
              ? "bg-blue-200 text-blue-800 hover:text-blue-800 active:text-blue-800 dark:bg-blue-200-dark dark:text-blue-800-dark"
              : "text-gray-500 hover:text-gray-500 active:text-gray-500 dark:text-gray-500-dark"
          )}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};

export default GroupChartViewTabs;
