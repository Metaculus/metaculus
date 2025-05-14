"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { DomainTuple } from "victory";

import NewNumericChart from "@/components/charts/new_numeric_chart";
import { Area, Line } from "@/types/charts";
import { Tournament } from "@/types/projects";

import { calculateIndexTimeline } from "./helpers";

type Props = {
  tournament: Tournament;
  height?: number;
};

const IndexTimeline: FC<Props> = ({ tournament, height = 170 }) => {
  const t = useTranslations();
  const chartData = buildIndexChartData(tournament);
  return (
    <NewNumericChart
      chartData={chartData}
      height={height}
      chartTitle={t("indexTimeline")}
      //   yLabel={"Index"}
    />
  );
};

function buildIndexChartData(tournament: Tournament) {
  // TODO: implement logic to calculate index chart data based on index questions
  const indexWeights = tournament.index_weights ?? [];
  const Y_DOMAIN_PADDING = 5;
  const { line, timestamps } = calculateIndexTimeline(indexWeights);
  const minDomain = timestamps[0] ?? 0;
  const maxDomain = timestamps[timestamps.length - 1] ?? 1;

  return {
    line: line as Line,
    area: [] as Area,
    points: [] as Line,
    yDomain: [-100 - Y_DOMAIN_PADDING, 100 + Y_DOMAIN_PADDING] as DomainTuple,
    xDomain: [minDomain, maxDomain] as DomainTuple,
    yScale: {
      ticks: [-100, -50, 0, 50, 100],
      tickFormat: (tick: number) => (tick > 0 ? `+${tick}` : tick.toString()),
    },
    xScale: {
      ticks: [0, 1], // TODO: calculate timestamp ticks
      tickFormat: (tick: number) => tick.toString(),
    },
  };
}
export default IndexTimeline;
