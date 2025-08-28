"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import FanChart from "@/components/charts/fan_chart";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { FanDatum } from "@/types/charts";
import { MultiYearIndexData, Tournament } from "@/types/projects";
import { QuestionType, Scaling } from "@/types/question";

import VerticalGradientArrow from "../vertical_legend_arrow";
import IndexGaugeV2 from "./index_gauge_v2";
import IndexTimeline from "./index_timeline";
import IndexTimelineByYear from "./index_timeline_by_year";
import { getVerticalLegendProps } from "../../helpers/index_legend";

type YearTab = "overview" | string;

type Props = {
  tournament: Tournament;
  multiYearIndexData: MultiYearIndexData | null;
};

const IndexHeaderBlock: React.FC<Props> = ({
  tournament,
  multiYearIndexData,
}) => {
  const t = useTranslations();
  const years = useMemo(
    () =>
      multiYearIndexData
        ? Object.keys(multiYearIndexData.series_by_year)
            .map(Number)
            .sort((a, b) => a - b)
        : [],
    [multiYearIndexData]
  );
  const buttons: GroupButton<YearTab>[] = useMemo(
    () => [
      { value: "overview", label: t("overview") },
      ...years.map((y) => ({ value: String(y), label: String(y) })),
    ],
    [t, years]
  );

  const [tab, setTab] = useState<YearTab>("overview");
  const isOverview = tab === "overview";
  const selectedYearSeries =
    !isOverview && multiYearIndexData
      ? multiYearIndexData.series_by_year[tab]
      : null;

  const hasMultiYear = years.length > 0;

  const overviewOptions = useMemo<FanDatum[] | null>(
    () =>
      multiYearIndexData ? buildOverviewFanOptions(multiYearIndexData) : null,
    [multiYearIndexData]
  );

  const baseIndex = multiYearIndexData ?? tournament.index_data ?? undefined;
  const legend = getVerticalLegendProps(baseIndex);

  return (
    <div className="mt-4 flex flex-col gap-6 sm:mt-6 sm:items-center [&>*:first-child::-webkit-scrollbar]:hidden [&>*:first-child]:overflow-x-auto [&>*:first-child]:[-ms-overflow-style:none] [&>*:first-child]:[scrollbar-width:none]">
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

      {!isOverview && (
        <div className="mb-12 w-full space-y-3 sm:mb-9">
          <p className="m-0 text-[16px] font-normal text-blue-900 dark:text-blue-900-dark">
            {t("currentValue")}
          </p>
          <IndexGaugeV2
            tournament={tournament}
            multiYearIndexData={multiYearIndexData}
            year={Number(tab)}
          />
        </div>
      )}

      <div className="w-full">
        {hasMultiYear && isOverview && overviewOptions && (
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
              withTooltip={false}
              variant="index"
            />
          </div>
        )}

        {hasMultiYear && !isOverview && selectedYearSeries && (
          <IndexTimelineByYear
            height={200}
            series={selectedYearSeries}
            chartTitle={t("timeline")}
            minLabel={baseIndex?.min_label ?? null}
            maxLabel={baseIndex?.max_label ?? null}
            increasingIsGood={baseIndex?.increasing_is_good ?? null}
          />
        )}

        {!hasMultiYear && (
          <IndexTimeline height={200} tournament={tournament} />
        )}
      </div>
    </div>
  );
};

const SCALING: Scaling = { range_min: -100, range_max: 100, zero_point: null };
const MIN = SCALING.range_min ?? -100;
const MAX = SCALING.range_max ?? 100;

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));
const toInternal = (v: number) => {
  const span = MAX - MIN || 1;
  return (clamp(v) - MIN) / span;
};

export function buildOverviewFanOptions(
  data: MultiYearIndexData
): FanDatum[] | null {
  if (!data?.series_by_year) return null;

  const entries = Object.entries(data.series_by_year)
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

      const median =
        (typeof s.resolution_value === "number" ? s.resolution_value : null) ??
        last?.y ??
        (lower + upper) / 2;

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
      } as FanDatum;
    })
    .filter(Boolean) as FanDatum[];

  return entries.length ? entries : null;
}

export default IndexHeaderBlock;
