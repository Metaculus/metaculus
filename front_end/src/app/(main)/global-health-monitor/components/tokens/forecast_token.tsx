"use client";

import { useLocale, useTranslations } from "next-intl";
import { ReactNode } from "react";

import cn from "@/utils/core/cn";

import { GHM_VALUES, GhmValueKey } from "../../config/questions";
import {
  formatInlineChange,
  formatInlineInterval,
  formatTimestamp,
} from "../../helpers/format";
import { TokenDatum } from "../../helpers/snapshot";
import { ChangeChip } from "../change_chip";
import { ForecastSparkline } from "../forecast_sparkline";
import { useGhmSnapshot } from "../ghm_data_provider";
import { TokenHoverCard, tokenBaseClassName } from "./token_hover_card";
import { useLinkedTimeline } from "../linked_timeline/linked_timeline_context";

function resolveChartKey(
  key: GhmValueKey,
  chartKeys: GhmValueKey[] | undefined
): GhmValueKey | null {
  if (!chartKeys?.length) {
    return null;
  }
  if (chartKeys.includes(key)) {
    return key;
  }
  const postId = GHM_VALUES[key].postId;
  return (
    chartKeys.find((chartKey) => GHM_VALUES[chartKey].postId === postId) ?? null
  );
}

function ForecastHoverContent({ datum }: { datum: TokenDatum }) {
  const t = useTranslations();
  const locale = useLocale();
  const snapshot = useGhmSnapshot();
  const compareEdition = snapshot?.compareEdition;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
        {t("communityPrediction")}
      </div>
      <div className="font-medium text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
        {datum.title}
        {datum.subtitle && (
          <span className="text-gray-600 dark:text-gray-600-dark">
            {" "}
            · {datum.subtitle}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xl font-bold leading-none text-blue-800 dark:text-blue-800-dark">
          {datum.display}
        </span>
        {datum.change && (
          <ChangeChip
            change={datum.change}
            sinceLabel={compareEdition?.label}
          />
        )}
      </div>
      {datum.change &&
        datum.change.direction !== "steady" &&
        compareEdition && (
          <div className="text-xs text-gray-600 dark:text-gray-600-dark">
            {t("globalHealthMonitorChangeSince", {
              change: datum.change.text,
              date: compareEdition.label,
            })}
          </div>
        )}
      {datum.interval && (
        <div className="text-xs text-gray-600 dark:text-gray-600-dark">
          {t("globalHealthMonitorInterval", { range: datum.interval })}
        </div>
      )}
      <ForecastSparkline points={datum.sparkline} />
      {datum.resolution && (
        <div className="text-xs font-medium text-gray-700 dark:text-gray-700-dark">
          {t("globalHealthMonitorResolvedAs", {
            value: datum.resolution.display,
          })}
          {datum.resolution.forecastWas &&
            ` · ${t("globalHealthMonitorForecastWas", { value: datum.resolution.forecastWas })}`}
        </div>
      )}
      <div className="text-xs text-gray-500 dark:text-gray-500-dark">
        {datum.lapsedSince
          ? t("globalHealthMonitorNoNewForecasts", {
              date: formatTimestamp(datum.lapsedSince, locale),
            })
          : datum.frozen && snapshot
            ? t("globalHealthMonitorValueAsOfEdition", {
                date: snapshot.edition.label,
              })
            : datum.asOf &&
              t("globalHealthMonitorForecastAsOf", {
                date: formatTimestamp(datum.asOf, locale),
              })}
      </div>
    </div>
  );
}

type Props = {
  v: GhmValueKey;
  // Appends the change since the previous edition, e.g. "4,494 (+28% since August)".
  change?: boolean;
  // Appends the 50% prediction interval.
  interval?: boolean;
  // Text kept inside the token right after the value, e.g. " animal cases".
  suffix?: string;
  // Replaces the rendered value, e.g. to link a phrase to a related question.
  children?: ReactNode;
};

export function Forecast({
  v,
  change = false,
  interval = false,
  suffix,
  children,
}: Props) {
  const t = useTranslations();
  const snapshot = useGhmSnapshot();
  const linkedTimeline = useLinkedTimeline();
  const datum = snapshot?.values[v] ?? null;

  if (!datum?.display) {
    return (
      <TokenHoverCard
        content={t("globalHealthMonitorForecastUnavailable")}
        className="text-gray-600 dark:text-gray-600-dark"
        dataAttributes={{ "data-ghm-token": v, "data-ghm-missing": "true" }}
      >
        —
      </TokenHoverCard>
    );
  }

  const chartKey = resolveChartKey(v, linkedTimeline?.chartKeys);
  const since = snapshot?.compareEdition?.shortLabel;
  const extras = [
    change && datum.change && since
      ? formatInlineChange(datum.change, since)
      : null,
    interval && datum.interval ? formatInlineInterval(datum.interval) : null,
  ].filter(Boolean);

  return (
    <TokenHoverCard
      href={`/questions/${datum.postId}/`}
      external
      content={<ForecastHoverContent datum={datum} />}
      onActiveChange={(active) => {
        if (chartKey) {
          linkedTimeline?.setHoveredKey(active ? chartKey : null);
        }
      }}
      className={cn(
        tokenBaseClassName,
        "font-semibold text-blue-800 decoration-blue-500 hover:bg-blue-200 hover:text-blue-900 dark:text-blue-800-dark dark:decoration-blue-500-dark dark:hover:bg-blue-200-dark dark:hover:text-blue-900-dark"
      )}
      dataAttributes={{
        "data-ghm-token": v,
        "data-ghm-value": datum.value ?? undefined,
        "data-ghm-display": datum.display,
        "data-ghm-change": datum.change?.text,
        "data-ghm-direction": datum.change?.direction,
        "data-ghm-frozen": datum.frozen ? "true" : undefined,
      }}
    >
      {children ?? datum.display}
      {!children && suffix}
      {!children && extras.length > 0 && ` (${extras.join("; ")})`}
    </TokenHoverCard>
  );
}
