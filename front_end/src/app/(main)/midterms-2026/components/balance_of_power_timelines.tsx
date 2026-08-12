"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

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

  return (
    // Even spacing between the three charts, flush to the panel's own padding at
    // the outer edges.
    <div className="[&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-2">
      <TimelineBlock
        title={t("midtermsHubChamberHouse")}
        timeline={timelines.house}
        unavailableLabel={unavailableLabel}
      />
      <TimelineBlock
        title={t("midtermsHubChamberSenate")}
        timeline={timelines.senate}
        unavailableLabel={unavailableLabel}
      />
      <TimelineBlock
        title={t("midtermsHubCongressForecast")}
        timeline={timelines.congress}
        unavailableLabel={unavailableLabel}
      />
    </div>
  );
};

const TimelineBlock: FC<{
  title: string;
  timeline: ControlTimeline | null;
  unavailableLabel: string;
}> = ({ title, timeline, unavailableLabel }) => {
  // Null = not hovering, so the legend shows the latest value. GroupChart reports
  // the hovered timestamp here and we look each series up at that point.
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);

  return (
    <div>
      <h4 className="m-0 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
        {title}
      </h4>
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
            defaultZoom={TimelineChartZoomOption.All}
            aggregation
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
            className="flex items-center gap-1.5 text-[11px] leading-tight text-blue-700 dark:text-blue-700-dark"
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
