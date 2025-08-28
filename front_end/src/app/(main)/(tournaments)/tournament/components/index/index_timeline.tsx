"use client";
import { FC, useCallback, useState } from "react";
import { DomainTuple } from "victory";

import NumericChart from "@/components/charts/numeric_chart";
import { METAC_COLORS } from "@/constants/colors";
import { Area, Line, TimelineChartZoomOption } from "@/types/charts";
import { IndexPoint, Tournament } from "@/types/projects";
import {
  generateNumericXDomain,
  generateTimestampXScale,
} from "@/utils/charts/axis";
import { isDefaultIndexData } from "@/utils/projects/helpers";

type Props = {
  tournament: Tournament;
  height?: number;
};

const IndexTimeline: FC<Props> = ({ tournament, height = 170 }) => {
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
    <NumericChart
      buildChartData={buildChartData}
      withZoomPicker={true}
      height={height}
      cursorTimestamp={cursorTimestamp}
      onCursorChange={handleCursorChange}
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
  const Y_DOMAIN_PADDING = 5;

  const series = isDefaultIndexData(tournament.index_data)
    ? tournament.index_data.series
    : null;
  const beLine: IndexPoint[] = series?.line ?? [];
  const timestamps = beLine.map((p) => p.x as number);
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
    line: beLine,
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
