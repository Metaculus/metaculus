"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import FanChart from "@/components/charts/fan_chart";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { GroupOfQuestionsGraphType, PostGroupOfQuestions } from "@/types/post";
import { MultiYearIndexData, Tournament } from "@/types/projects";
import {
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";

import IndexGaugeV2 from "./index_gauge_v2";
import IndexTimeline from "./index_timeline";
import IndexTimelineByYear from "./index_timeline_by_year";
import VerticalGradientArrow from "../vertical_legend_arrow";

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

  const overviewGroup = useMemo(
    () =>
      multiYearIndexData ? buildOverviewFanGroup(multiYearIndexData) : null,
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
        {hasMultiYear && isOverview && overviewGroup && (
          <div className="flex gap-4 sm:gap-6">
            <VerticalGradientArrow className="hidden sm:block" />
            <VerticalGradientArrow
              stemThickness={3}
              stemHeight={94}
              className="mt-4 max-w-[66px] border-none p-0 sm:hidden"
            />
            <FanChart
              suppressAvailabilityBanner
              group={overviewGroup}
              height={220}
              withTooltip={false}
              indexVariant
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

export default IndexHeaderBlock;

const SCALING: Scaling = { range_min: -100, range_max: 100, zero_point: null };
const MIN = SCALING.range_min ?? -100;
const MAX = SCALING.range_max ?? 100;

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));
const toInternal = (v: number) => {
  const span = MAX - MIN || 1;
  return (clamp(v) - MIN) / span;
};

function cdfFromQuartiles(a: number, m: number, b: number, n = 101): number[] {
  const EPS = 1e-6;
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  const seg = (x: number, x0: number, x1: number, y0: number, y1: number) =>
    y0 + (y1 - y0) * ((x - x0) / Math.max(x1 - x0, EPS));

  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let c: number;
    if (x <= a) c = seg(x, 0, a || EPS, 0, 0.25);
    else if (x <= m) c = seg(x, a, m || a + EPS, 0.25, 0.5);
    else if (x <= b) c = seg(x, m, b || m + EPS, 0.5, 0.75);
    else c = seg(x, b, 1, 0.75, 1);
    out[i] = clamp01(c);
  }
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i] ?? 0, out[i - 1] ?? 0);
  out[n - 1] = 1;
  return out;
}

export function buildOverviewFanGroup(
  data: MultiYearIndexData
): PostGroupOfQuestions<QuestionWithNumericForecasts> | null {
  if (!data?.dimensions?.length) return null;

  const questions = data.years
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

      const l = Number(q.lower25);
      const m = Number(q.median);
      const u = Number(q.upper75);

      const cdf = cdfFromQuartiles(toInternal(l), toInternal(m), toInternal(u));

      const aggregation = {
        latest: {
          centers: [toInternal(m)],
          interval_lower_bounds: [toInternal(l)],
          interval_upper_bounds: [toInternal(u)],
          forecast_values: cdf,
        },
        history: [],
        series: [],
      };

      const question = {
        label: key,
        type: QuestionType.Numeric,
        scaling: { ...SCALING, zero_point: null },
        default_aggregation_method: "community",
        aggregations: { community: aggregation },
        resolution: null,
        my_forecasts: { history: [] },
        open_time: "",
        actual_close_time: "",
      } as unknown as QuestionWithNumericForecasts;

      return question;
    })
    .filter(Boolean) as QuestionWithNumericForecasts[];

  if (!questions.length) return null;

  return {
    id: -1,
    description: "",
    resolution_criteria: "",
    fine_print: "",
    group_variable: "year",
    graph_type: GroupOfQuestionsGraphType.FanGraph,
    questions,
  };
}
