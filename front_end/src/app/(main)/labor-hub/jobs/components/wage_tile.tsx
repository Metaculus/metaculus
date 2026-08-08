import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

type Props = {
  value: number;
};

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

function valueClass(value: number): string {
  if (value > 0) return "text-mc-option-3 dark:text-mc-option-3-dark";
  if (value < 0) return "text-mc-option-2 dark:text-mc-option-2-dark";
  return "text-blue-900 dark:text-blue-900-dark";
}

/** Median-wage tile. Rendered only when the job has wage data. */
export async function WageTile({ value }: Props) {
  const t = await getTranslations();
  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-3 dark:border-blue-300-dark dark:bg-blue-100-dark md:p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark md:text-xs">
        {t("laborHubJobsWagesTitle")}
      </div>
      <div
        className={cn(
          "mt-2 font-jetbrains-mono text-xl font-bold leading-none tracking-[-0.02em] md:mt-3 md:text-3xl",
          valueClass(value)
        )}
      >
        {formatPercent(value)}
      </div>
      <div className="mt-1 text-[11px] text-blue-700 dark:text-blue-700-dark md:text-xs">
        {t("laborHubJobsWagesSub")}
      </div>
    </div>
  );
}
