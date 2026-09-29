"use client";

import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { ChangeChip } from "./change_chip";
import { useGhmSnapshot } from "./ghm_data_provider";
import { GhmValueKey } from "../config/questions";
import { TokenDatum } from "../helpers/snapshot";

function ResolvedBadge({
  resolution,
}: {
  resolution: NonNullable<TokenDatum["resolution"]>;
}) {
  const t = useTranslations();
  return (
    <span className="inline-flex flex-wrap items-center gap-1 rounded-sm bg-gray-200 px-1.5 py-0.5 text-xs font-medium leading-4 text-gray-800 dark:bg-gray-200-dark dark:text-gray-800-dark">
      {t("globalHealthMonitorResolvedAs", { value: resolution.display })}
      {resolution.forecastWas && (
        <span className="font-normal text-gray-600 dark:text-gray-600-dark">
          ·{" "}
          {t("globalHealthMonitorForecastWas", {
            value: resolution.forecastWas,
          })}
        </span>
      )}
    </span>
  );
}

/** Change since the previous edition for each value a card tracks. */
export function CardChanges({
  values,
  className,
}: {
  values: GhmValueKey[];
  className?: string;
}) {
  const t = useTranslations();
  const snapshot = useGhmSnapshot();
  const compareEdition = snapshot?.compareEdition;
  const items = values
    .map((key) => snapshot?.values[key])
    .filter((datum): datum is TokenDatum => !!datum);

  if (!items.length) {
    return null;
  }

  const [single] = items;
  if (items.length === 1 && single) {
    if (single.resolution) {
      return <ResolvedBadge resolution={single.resolution} />;
    }
    if (!single.change || !compareEdition) {
      return null;
    }
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark",
          className
        )}
      >
        <ChangeChip change={single.change} sinceLabel={compareEdition.label} />
        <span>
          {t("globalHealthMonitorSinceEdition", { date: compareEdition.label })}
        </span>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0 text-xs",
        className
      )}
    >
      {items.map((datum) => (
        <li key={datum.key} className="flex items-center gap-1.5">
          <span className="text-gray-700 dark:text-gray-700-dark">
            {datum.subtitle}
          </span>
          {datum.resolution ? (
            <ResolvedBadge resolution={datum.resolution} />
          ) : (
            datum.change &&
            compareEdition && (
              <ChangeChip
                change={datum.change}
                sinceLabel={compareEdition.label}
              />
            )
          )}
        </li>
      ))}
    </ul>
  );
}
