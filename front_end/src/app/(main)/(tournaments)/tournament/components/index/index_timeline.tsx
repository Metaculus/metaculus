"use client";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { DomainTuple } from "victory";

import NewNumericChart from "@/components/charts/new_numeric_chart";
import { METAC_COLORS } from "@/constants/colors";
import { Area, Line } from "@/types/charts";
import { TimelineChartZoomOption } from "@/types/charts";
import { Tournament } from "@/types/projects";
import {
  generateNumericXDomain,
  generateTimestampXScale,
} from "@/utils/charts/axis";

import { calculateIndexTimeline } from "./helpers";

type Props = {
  tournament: Tournament;
  height?: number;
};

const IndexTimeline: FC<Props> = ({ tournament, height = 170 }) => {
  const t = useTranslations();
  const buildChartData = useCallback(
    (width: number, zoom: TimelineChartZoomOption) =>
      buildIndexChartData({ tournament, width, zoom }),
    [tournament]
  );
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const handleCursorChange = (value: number | null) => {
    setCursorTimestamp(value);
  };

  return (
    <NewNumericChart
      buildChartData={buildChartData}
      withZoomPicker={true}
      height={height}
      cursorTimestamp={cursorTimestamp}
      onCursorChange={handleCursorChange}
      chartTitle={t("indexTimeline")}
      colorOverride={METAC_COLORS.blue["600"]}
    />
  );
};

function buildIndexChartData({
  tournament,
  width,
  zoom,
}: {
  tournament: Tournament;
  width: number;
  zoom: TimelineChartZoomOption;
}) {
  const indexWeights = tournament.index_weights ?? [];
  const Y_DOMAIN_PADDING = 5;
  const { line, timestamps } = calculateIndexTimeline(indexWeights);
  const earliestTimestamp = timestamps[0] ?? 0;
  const latestTimestamp = timestamps[timestamps.length - 1] ?? 1;

  // add small padding for x axis data
  const timestampPadding = (latestTimestamp - earliestTimestamp) * 0.03;
  const xDomain = generateNumericXDomain(
    [earliestTimestamp - timestampPadding, ...timestamps],
    zoom
  );
  // for scale we take actual domain without the padding
  const xScale = generateTimestampXScale(
    [earliestTimestamp, latestTimestamp],
    width
  );
  return {
    line: line as Line,
    area: [] as Area,
    points: [] as Line,
    yDomain: [-100 - Y_DOMAIN_PADDING, 100 + Y_DOMAIN_PADDING] as DomainTuple,
    yScale: {
      ticks: [-100, -50, 0, 50, 100],
      tickFormat: (tick: number) => (tick > 0 ? `+${tick}` : tick.toString()),
    },
    xDomain,
    xScale,
  };
}

export default IndexTimeline;
