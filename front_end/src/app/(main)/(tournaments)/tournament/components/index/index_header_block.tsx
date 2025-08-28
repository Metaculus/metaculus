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
    () => multiYearIndexData?.years ?? [],
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

  return (
    <div className="mt-4 flex flex-col gap-6 sm:mt-6 sm:items-center">
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
            <VerticalGradientArrow className="hidden sm:block" />
            <VerticalGradientArrow
              stemThickness={3}
              stemHeight={94}
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
  if (!data?.dimensions?.length) return null;

  const options: FanDatum[] = data.years
    .map((y) => String(y))
    .map((key) => {
      const dim = data.dimensions.find((d) => d.key === key);
      if (!dim) return null;

      const q = dim.quartiles;
      const hasAll =
        Number.isFinite(q?.lower25) &&
        Number.isFinite(q?.median) &&
        Number.isFinite(q?.upper75);
      if (!hasAll) return null;

      const l = toInternal(Number(q.lower25));
      const m = toInternal(Number(q.median));
      const u = toInternal(Number(q.upper75));

      return {
        name: key,
        communityQuartiles: { lower25: l, median: m, upper75: u },
        optionScaling: SCALING,
        type: QuestionType.Numeric,
      };
    })
    .filter(Boolean) as FanDatum[];

  return options.length ? options : null;
}

export default IndexHeaderBlock;
