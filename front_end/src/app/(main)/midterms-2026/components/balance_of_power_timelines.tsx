"use client";

import { useTranslations } from "next-intl";
import { FC, ReactNode, useMemo, useState } from "react";

import GroupChart from "@/components/charts/group_chart";
import { MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

import { MIDTERMS_COLORS } from "../constants";
import { CONGRESS_OUTCOME_LABELS } from "../data";
import TimelineRangeToggle from "./timeline_range_toggle";
import {
  buildControlTimeline,
  ControlTimeline,
} from "../helpers/build_control_timelines";
import { useIsDark } from "../helpers/use_is_dark";

// Deliberately compact for the ~320px-wide sidebar column. Of this, PLOT_TOP
// (10px) and the axis band (20px) are chrome, so the trend itself gets ~72px —
// enough to read direction and crossings, which is all these are for. The
// precise numbers live in the legend, not the axes.
const CHART_HEIGHT = 102;

const DEM: ThemeColor = {
  DEFAULT: MIDTERMS_COLORS.demPrimary,
  dark: MIDTERMS_COLORS.demPrimaryDark,
};
const REP: ThemeColor = {
  DEFAULT: MIDTERMS_COLORS.repPrimary,
  dark: MIDTERMS_COLORS.repPrimaryDark,
};

// The four congress outcomes use the shared multiple-choice palette rather than
// party tints: two blues and two reds sit too close together to tell apart as
// four separate lines.
const NEUTRAL_FALLBACK: ThemeColor = {
  DEFAULT: MIDTERMS_COLORS.spectrumNeutral,
  dark: MIDTERMS_COLORS.spectrumNeutral,
};
const MC = (i: number): ThemeColor =>
  MULTIPLE_CHOICE_COLOR_SCALE[i] ?? NEUTRAL_FALLBACK;

type Props = {
  /** The congress-control post (#34484) — the source for all three timelines. */
  post: PostWithForecasts | null;
};

const BalanceOfPowerTimelines: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const question = post?.question as
    | QuestionWithMultipleChoiceForecasts
    | undefined;
  // One timeframe for all three charts — they answer the same question about the
  // same window, so letting them drift apart would invite false comparisons.
  // Opens on two months: the full history reaches back to Jan 2025 and its early
  // flat stretch squashes the recent movement. ALL is a click away.
  const [zoom, setZoom] = useState<TimelineChartZoomOption>(
    TimelineChartZoomOption.TwoMonths
  );

  const demLabel = t("midtermsHubPartyDemocrats");
  const repLabel = t("midtermsHubPartyRepublicans");

  const timelines = useMemo(() => {
    // Same option sums as chamber_control_card.tsx, so the last point of each
    // series lands on the percentage the snapshot view shows.
    const house = buildControlTimeline(question, [
      {
        label: demLabel,
        color: DEM,
        optionLabels: [CONGRESS_OUTCOME_LABELS.DD, CONGRESS_OUTCOME_LABELS.RD],
      },
      {
        label: repLabel,
        color: REP,
        optionLabels: [CONGRESS_OUTCOME_LABELS.RR, CONGRESS_OUTCOME_LABELS.DR],
      },
    ]);
    const senate = buildControlTimeline(question, [
      {
        label: demLabel,
        color: DEM,
        optionLabels: [CONGRESS_OUTCOME_LABELS.DD, CONGRESS_OUTCOME_LABELS.DR],
      },
      {
        label: repLabel,
        color: REP,
        optionLabels: [CONGRESS_OUTCOME_LABELS.RR, CONGRESS_OUTCOME_LABELS.RD],
      },
    ]);
    // The four outcomes read directly — no summing.
    const congress = buildControlTimeline(question, [
      {
        label: t("midtermsHubOutcomeRepRep"),
        color: MC(0),
        optionLabels: [CONGRESS_OUTCOME_LABELS.RR],
      },
      {
        label: t("midtermsHubOutcomeRepDem"),
        color: MC(1),
        optionLabels: [CONGRESS_OUTCOME_LABELS.RD],
      },
      {
        label: t("midtermsHubOutcomeDemRep"),
        color: MC(2),
        optionLabels: [CONGRESS_OUTCOME_LABELS.DR],
      },
      {
        label: t("midtermsHubOutcomeDemDem"),
        color: MC(3),
        optionLabels: [CONGRESS_OUTCOME_LABELS.DD],
      },
    ]);
    return { house, senate, congress };
  }, [question, demLabel, repLabel, t]);

  const unavailableLabel = t("midtermsHubTimelineUnavailable");
  const rangeToggle = <TimelineRangeToggle value={zoom} onChange={setZoom} />;

  return (
    <div className="relative">
      {/* md+: straddle the card's top edge at the panel's right. The negative
          offset cancels the column's own padding so the pill's centre lands on
          the border, and it tracks the padding step at lg. */}
      {/* flex, not block: a block wrapper around the inline-flex pill picks up
          ~8px of baseline descender space, which would offset the centring. */}
      <div className="absolute -top-5 right-0 z-10 hidden -translate-y-1/2 md:flex lg:-top-8">
        {rangeToggle}
      </div>
      {/* Spacing lives on its own wrapper: as a sibling of the absolute toggle,
          the child selectors below can't catch it — previously it picked up py-2
          and stole :first-child from the House block. */}
      <div className="[&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-2">
        <TimelineBlock
          title={t("midtermsHubChamberHouse")}
          timeline={timelines.house}
          unavailableLabel={unavailableLabel}
          zoom={zoom}
          // Below md there's no room above the panel — it sits directly under the
          // map behind a rule — so the toggle rides the first title's row instead.
          titleAccessory={<div className="flex md:hidden">{rangeToggle}</div>}
        />
        <TimelineBlock
          title={t("midtermsHubChamberSenate")}
          timeline={timelines.senate}
          unavailableLabel={unavailableLabel}
          zoom={zoom}
        />
        <TimelineBlock
          title={t("midtermsHubCongressForecast")}
          timeline={timelines.congress}
          unavailableLabel={unavailableLabel}
          zoom={zoom}
        />
      </div>
    </div>
  );
};

const TimelineBlock: FC<{
  title: string;
  timeline: ControlTimeline | null;
  unavailableLabel: string;
  zoom: TimelineChartZoomOption;
  /** Optional control rendered on the title's row, right-aligned. */
  titleAccessory?: ReactNode;
}> = ({ title, timeline, unavailableLabel, zoom, titleAccessory }) => {
  // Null = not hovering, so the legend shows the latest value. GroupChart reports
  // the hovered timestamp here and we look each series up at that point.
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h4 className="m-0 text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
          {title}
        </h4>
        {titleAccessory}
      </div>
      {timeline ? (
        <div onMouseLeave={() => setCursorTimestamp(null)}>
          <TimelineLegend
            timeline={timeline}
            cursorTimestamp={cursorTimestamp}
          />
          <GroupChart
            timestamps={timeline.timestamps}
            choiceItems={timeline.choiceItems}
            questionType={QuestionType.Binary}
            height={CHART_HEIGHT}
            // Controlled by the panel's single range toggle.
            zoom={zoom}
            aggregation
            // Fit the axis to the plotted range instead of a fixed 0–100%: over a
            // two-month window these forecasts move a few points, which on the
            // full axis is a flat line. Binary charts opt in explicitly, and the
            // floor stops a quiet stretch from magnifying noise. The legend still
            // carries the absolute values.
            binaryYZoom
            minYSpan={0.1}
            yDomainOptions={{ source: "centers" }}
            hideYAxis
            // No standing x labels; the hovered date is the only x value shown,
            // rendered by showCursorLabel in the band the ticks used to occupy.
            hideXAxis
            showCursorLabel
            // Pins a dot to each line's endpoint at rest; with onCursorChange set
            // the dots track the cursor instead.
            forceShowLinePoints
            onCursorChange={(value) => setCursorTimestamp(value)}
          />
        </div>
      ) : (
        <div
          className="mt-2 flex items-center justify-center rounded-md border border-dashed border-blue-300 text-sm text-blue-600 dark:border-blue-300-dark dark:text-blue-600-dark"
          style={{ height: CHART_HEIGHT }}
        >
          {unavailableLabel}
        </div>
      )}
    </div>
  );
};

const TimelineLegend: FC<{
  timeline: ControlTimeline;
  cursorTimestamp: number | null;
}> = ({ timeline, cursorTimestamp }) => {
  const isDark = useIsDark();
  const index = resolveIndex(timeline.timestamps, cursorTimestamp);

  return (
    <div className="mb-1 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      {timeline.choiceItems.map((item) => {
        const value = item.aggregationValues[index];
        return (
          <span
            key={item.choice}
            className="flex items-center gap-1.5 text-sm leading-tight text-blue-700 dark:text-blue-700-dark"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: isDark ? item.color.dark : item.color.DEFAULT,
              }}
            />
            {item.choice}
            <span className="font-semibold tabular-nums text-blue-800 dark:text-blue-800-dark">
              {value == null ? "—" : `${(value * 100).toFixed(1)}%`}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Index of the last point at or before the cursor; the latest point when idle. */
function resolveIndex(
  timestamps: number[],
  cursorTimestamp: number | null
): number {
  const lastIndex = timestamps.length - 1;
  if (cursorTimestamp == null) return lastIndex;
  for (let i = lastIndex; i >= 0; i--) {
    if ((timestamps[i] ?? 0) <= cursorTimestamp) return i;
  }
  return 0;
}

export default BalanceOfPowerTimelines;
