import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

import { formatSignedPercent } from "../helpers/format";
import { type WallYear } from "../helpers/wall_types";

type Props = {
  forecasts: Record<WallYear, number | null>;
};

function valueClass(value: number | null): string {
  if (value == null) return "text-blue-700 dark:text-blue-700-dark";
  if (value > 0) return "text-mc-option-3 dark:text-mc-option-3-dark";
  if (value < 0) return "text-mc-option-2 dark:text-mc-option-2-dark";
  return "text-blue-700 dark:text-blue-700-dark";
}

export async function YearStats({ forecasts }: Props) {
  const t = await getTranslations();
  const years: WallYear[] = ["2027", "2030", "2035"];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {years.map((year) => {
        const value = forecasts[year];
        return (
          <div
            key={year}
            className="rounded-md border border-blue-300 bg-blue-100 p-2.5 dark:border-blue-300-dark dark:bg-blue-100-dark xs:p-3 sm:p-4"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
              {t("laborHubJobsByYear", { year })}
            </div>
            <div
              className={cn(
                "mt-1 font-jetbrains-mono text-xl font-bold leading-none tracking-tight xs:text-2xl sm:text-3xl",
                valueClass(value)
              )}
            >
              {formatSignedPercent(value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
