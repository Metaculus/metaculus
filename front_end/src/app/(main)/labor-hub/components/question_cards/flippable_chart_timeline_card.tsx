import {
  faClockRotateLeft,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode, Suspense } from "react";

import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
import ServerPostsApi from "@/services/api/posts/posts.server";

import { BasicQuestionContent } from "./basic_question";
import {
  FlippableQuestionCard,
  type FlipSide,
} from "./flippable_question_card";
import { type MultiQuestionRowConfig } from "./multi_question_data";
import {
  MultiQuestionLineChart,
  type MultiQuestionLineChartProps,
} from "./multi_question_line_chart";
import { NoQuestionPlaceholder } from "./placeholder";
import { QuestionCard, QuestionCardSkeleton } from "./question_card";

type FlippableChartTimelineCardProps = {
  questionId: number;
  title?: ReactNode;
  subtitle?: string;
  fallbackTitle?: string;
  note?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
  prefer?: "chart" | "timeline";
  defaultSide?: FlipSide;
  historicalValues?: Record<string, number | null>;
  /** Overrides the main question's legend label (defaults to the post title). */
  seriesTitle?: string;
  /** Extra series rendered alongside the main question (e.g. static reference lines). */
  extraRows?: MultiQuestionRowConfig[];
  chartHeight?: number;
  chartProps?: Omit<
    MultiQuestionLineChartProps,
    "title" | "rows" | "note" | "showLegend" | "showMoreButton" | "className"
  >;
  timelineMarkers?: GroupTimelineMarker[];
};

async function FlippableChartTimelineContent({
  questionId,
  title,
  subtitle,
  fallbackTitle,
  note,
  className,
  variant = "secondary",
  prefer,
  defaultSide = "left",
  historicalValues,
  seriesTitle,
  extraRows,
  chartHeight,
  chartProps,
  timelineMarkers,
}: FlippableChartTimelineCardProps) {
  let postData;
  try {
    postData = await ServerPostsApi.getPost(questionId, true);
  } catch {
    return (
      <QuestionCard
        title={title || fallbackTitle}
        subtitle={subtitle}
        variant={variant}
        className={className}
        postIds={[questionId]}
      >
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }

  const resolvedDefaultSide =
    prefer != null ? (prefer === "timeline" ? "right" : "left") : defaultSide;
  const resolvedTitle = title || postData.title;

  return (
    <>
      <FlippableQuestionCard
        leftContent={
          <MultiQuestionLineChart
            {...chartProps}
            rows={[
              {
                questionId,
                title: seriesTitle ?? postData.title,
                historicalValues,
              },
              ...(extraRows ?? []),
            ]}
            showLegend={(extraRows?.length ?? 0) > 0}
            showMoreButton={false}
            height={chartProps?.height ?? chartHeight ?? 250}
          />
        }
        rightContent={
          <BasicQuestionContent
            postData={postData}
            preferTimeline
            chartHeight={chartHeight}
            timelineMarkers={timelineMarkers}
            timelineSubtitle="How the forecasts have changed over time"
          />
        }
        leftIcon={faChartLine}
        rightIcon={faClockRotateLeft}
        title={resolvedTitle}
        subtitle={subtitle}
        variant={variant}
        className={className}
        postIds={[postData.id]}
        defaultSide={resolvedDefaultSide}
      />
      {note && (
        <div className="!mt-2 text-sm text-blue-700 dark:text-blue-700-dark">
          {note}
        </div>
      )}
    </>
  );
}

export function FlippableChartTimelineCard(
  props: FlippableChartTimelineCardProps
) {
  return (
    <Suspense
      fallback={
        <QuestionCardSkeleton
          variant={props.variant}
          className={props.className}
        />
      }
    >
      <FlippableChartTimelineContent {...props} />
    </Suspense>
  );
}
