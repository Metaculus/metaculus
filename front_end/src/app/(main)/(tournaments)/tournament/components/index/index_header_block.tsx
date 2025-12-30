"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useMemo, useState } from "react";

import FanChart from "@/components/charts/fan_chart";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { FanDatum } from "@/types/charts";
import { IndexSeries, MultiYearIndexData, Tournament } from "@/types/projects";
import { QuestionType, Scaling } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isDefaultIndexData,
  isMultiYearIndexData,
} from "@/utils/projects/helpers";

import VerticalGradientArrow from "../vertical_legend_arrow";
import IndexGauge from "./index_gauge";
import IndexTimeline from "./index_timeline";
import {
  getIndexBounds,
  getVerticalLegendProps,
} from "../../helpers/index_legend";

type YearTab = "overview" | string;

type Props = {
  tournament: Tournament;
  children?: ReactNode;
};

export default function IndexHeaderBlock({ tournament, children }: Props) {
  const t = useTranslations();
  const idx = tournament.index_data;

  const years = useMemo(
    () =>
      isMultiYearIndexData(idx)
        ? Object.keys(idx.series_by_year).map(String).sort()
        : [],
    [idx]
  );
  const hasMultiYear = years.length > 0;

  const buttons: GroupButton<YearTab>[] = useMemo(
    () =>
      hasMultiYear
        ? [
            { value: "overview", label: t("overview") },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]
        : [],
    [t, years, hasMultiYear]
  );
  const [tab, setTab] = useState<YearTab>("overview");
  const isOverview = hasMultiYear && tab === "overview";
  const overviewOptions = useMemo<FanDatum[] | null>(
    () =>
      hasMultiYear && isMultiYearIndexData(idx)
        ? buildOverviewFanOptions(idx)
        : null,
    [hasMultiYear, idx]
  );

  const legend = getVerticalLegendProps(idx);
  const { MIN, MAX } = getIndexBounds(idx ?? undefined);

  const seriesForTimeline: IndexSeries | null = useMemo(() => {
    if (hasMultiYear && !isOverview && isMultiYearIndexData(idx)) {
      return idx.series_by_year[tab] ?? null;
    }
    if (!hasMultiYear && isDefaultIndexData(idx)) {
      return idx.series ?? null;
    }
    return null;
  }, [hasMultiYear, isOverview, idx, tab]);

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-6 sm:mt-6 sm:items-center",
        hasMultiYear &&
          "[&>*:first-child::-webkit-scrollbar]:hidden [&>*:first-child]:overflow-x-auto [&>*:first-child]:[-ms-overflow-style:none] [&>*:first-child]:[scrollbar-width:none]"
      )}
    >
      {hasMultiYear && (
        <ButtonGroup<YearTab>
          value={tab}
          buttons={buttons}
          onChange={setTab}
          activeVariant="primary"
          className="px-3"
          activeClassName="px-3"
        />
      )}

      {((hasMultiYear && !isOverview) ||
        (!hasMultiYear && isDefaultIndexData(tournament.index_data))) && (
        <div className="mb-12 w-full space-y-3 sm:mb-9">
          <p className="m-0 text-[16px] font-normal text-blue-900 dark:text-blue-900-dark">
            {t("currentValue")}
          </p>
          <IndexGauge tournament={tournament} year={tab} />
        </div>
      )}

      <div className="w-full">
        {isOverview && overviewOptions && (
          <div className="flex gap-4 sm:gap-6">
            <VerticalGradientArrow {...legend} className="hidden sm:block" />
            <VerticalGradientArrow
              {...legend}
              stemThickness={3}
              className="mt-4 max-w-[66px] border-none p-0 sm:hidden"
            />
            <FanChart
              options={overviewOptions}
              height={220}
              withTooltip
              variant="index"
              fixedYDomain={[MIN, MAX]}
            />
          </div>
        )}

        {!isOverview && seriesForTimeline && (
          <IndexTimeline
            height={200}
            series={seriesForTimeline}
            chartTitle={t("timeline")}
            minLabel={idx?.min_label ?? null}
            maxLabel={idx?.max_label ?? null}
            increasingIsGood={idx?.increasing_is_good ?? null}
            min={idx?.min ?? null}
            max={idx?.max ?? null}
          />
        )}

        {children ? <div className="mt-4 sm:mt-5">{children}</div> : null}
      </div>
    </div>
  );
}

export function buildOverviewFanOptions(
  data: MultiYearIndexData
): FanDatum[] | null {
  if (!data?.series_by_year) return null;

  const { MIN, MAX } = getIndexBounds(data);
  const SCALING: Scaling = { range_min: MIN, range_max: MAX, zero_point: null };

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));
  const toInternal = (v: number) => {
    const span = MAX - MIN || 1;
    return (clamp(v) - MIN) / span;
  };

  const entries = Object.entries(data.series_by_year)
    .sort()
    .map(([year, s]) => {
      const last = s.line.length ? s.line[s.line.length - 1] : null;

      const lower =
        typeof s.interval_lower_bounds === "number"
          ? s.interval_lower_bounds
          : Math.min(...(s.line.map((p) => p.y) || [0]));

      const upper =
        typeof s.interval_upper_bounds === "number"
          ? s.interval_upper_bounds
          : Math.max(...(s.line.map((p) => p.y) || [0]));

      const isResolved =
        s.status === "resolved" || typeof s.resolution_value === "number";

      const median =
        (typeof s.resolution_value === "number" ? s.resolution_value : null) ??
        last?.y ??
        (lower + upper) / 2;

      const resolvedValueRaw =
        typeof s.resolution_value === "number"
          ? s.resolution_value
          : isResolved
            ? last?.y
            : undefined;

      const hasAll =
        Number.isFinite(lower) &&
        Number.isFinite(median) &&
        Number.isFinite(upper);
      if (!hasAll) return null;

      return {
        name: year,
        communityQuartiles: {
          lower25: toInternal(Number(lower)),
          median: toInternal(Number(median)),
          upper75: toInternal(Number(upper)),
        },
        optionScaling: SCALING,
        type: QuestionType.Numeric,
        resolved: isResolved,
        resolvedValue:
          typeof resolvedValueRaw === "number"
            ? toInternal(resolvedValueRaw)
            : undefined,
      } as FanDatum;
    })
    .filter(Boolean) as FanDatum[];

  return entries.length ? entries : null;
}
