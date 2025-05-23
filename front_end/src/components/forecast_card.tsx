"use client";
import Link from "next/link";
import { FC, memo, useEffect, useMemo, useRef, useState } from "react";

import { EmbedTheme } from "@/app/(embed)/questions/constants/embed_theme";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import FanChart from "@/components/charts/fan_chart";
import NumericChart from "@/components/charts/numeric_chart";
import ConditionalTile from "@/components/conditional_tile";
import DetailedMultipleChoiceChartCard from "@/components/detailed_question_card/detailed_question_card/multiple_choice_chart_card";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import PredictionChip from "@/components/prediction_chip";
import { TimelineChartZoomOption } from "@/types/charts";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { getCursorForecast } from "@/utils/charts/cursor";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import {
  getPostDrivenTime,
  isConditionalPost,
} from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
  className?: string;
  embedTheme?: EmbedTheme;
  defaultChartZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  nonInteractive?: boolean;
  navigateToNewTab?: boolean;
  embedTitle?: string;
};

const ForecastCard: FC<Props> = ({
  post,
  className,
  embedTheme,
  defaultChartZoom,
  withZoomPicker,
  nonInteractive = false,
  navigateToNewTab,
  embedTitle,
}) => {
  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(0);
  const withLegend = useMemo(
    () =>
      post.group_of_questions?.graph_type ===
        GroupOfQuestionsGraphType.MultipleChoiceGraph ||
      post.question?.type === QuestionType.MultipleChoice,
    [post.group_of_questions?.graph_type, post.question?.type]
  );

  useEffect(() => {
    if (!chartContainerRef.current) return;

    setChartHeight(
      chartContainerRef.current?.clientHeight - (withZoomPicker ? 32 : 0)
    );
  }, [withZoomPicker, withLegend]);

  const renderChart = () => {
    if (post.group_of_questions) {
      switch (post.group_of_questions.graph_type) {
        case GroupOfQuestionsGraphType.FanGraph: {
          return (
            <FanChart
              group={post.group_of_questions}
              height={chartHeight}
              withTooltip={!nonInteractive}
              extraTheme={embedTheme?.chart}
            />
          );
        }
        case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
          return (
            <MultipleChoiceGroupChart
              group={post.group_of_questions}
              actualCloseTime={getPostDrivenTime(post.actual_close_time)}
              openTime={getPostDrivenTime(post.open_time)}
              chartHeight={chartHeight}
              chartTheme={embedTheme?.chart}
              defaultZoom={defaultChartZoom}
              embedMode
            />
          );
        }
        default:
          return null;
      }
    }

    if (isConditionalPost(post)) {
      return <ConditionalTile post={post} chartTheme={embedTheme?.chart} />;
    }

    if (post.question) {
      const { question } = post;
      const forecastAvailability = getQuestionForecastAvailability(question);
      switch (question.type) {
        case QuestionType.Binary:
        case QuestionType.Numeric:
        case QuestionType.Discrete:
        case QuestionType.Date:
          return (
            <div className="relative flex w-full flex-col">
              <NumericChart
                aggregation={question.aggregations.recency_weighted}
                myForecasts={question.my_forecasts}
                resolution={question.resolution}
                resolveTime={question.actual_resolve_time}
                height={chartHeight}
                questionType={question.type}
                actualCloseTime={getPostDrivenTime(question.actual_close_time)}
                scaling={question.scaling}
                onCursorChange={nonInteractive ? undefined : setCursorTimestamp}
                extraTheme={embedTheme?.chart}
                defaultZoom={defaultChartZoom}
                withZoomPicker={withZoomPicker}
                withUserForecastTimestamps={!!forecastAvailability.cpRevealsOn}
                isEmptyDomain={
                  forecastAvailability.isEmpty ||
                  !!forecastAvailability.cpRevealsOn
                }
                openTime={getPostDrivenTime(question.open_time)}
                unit={question.unit}
              />
              <ForecastAvailabilityChartOverflow
                forecastAvailability={forecastAvailability}
                className="justify-end pr-10 text-xs md:text-sm"
              />
            </div>
          );
        case QuestionType.MultipleChoice:
          return (
            <DetailedMultipleChoiceChartCard
              question={question}
              embedMode
              chartHeight={chartHeight}
              chartTheme={embedTheme?.chart}
              defaultZoom={defaultChartZoom}
              forecastAvailability={forecastAvailability}
            />
          );
        default:
          return null;
      }
    }

    return null;
  };

  const renderPrediction = () => {
    if (post.question) {
      const { question } = post;
      switch (question.type) {
        case QuestionType.Binary:
        case QuestionType.Numeric:
        case QuestionType.Discrete:
        case QuestionType.Date: {
          const cursorForecast = getCursorForecast(
            cursorTimestamp,
            question.aggregations.recency_weighted
          );

          return (
            <PredictionChip
              question={question}
              status={post.status}
              predictionOverride={cursorForecast?.centers?.at(-1)}
              className="ForecastCard-prediction"
              unresolvedChipStyle={embedTheme?.predictionChip}
              enforceCPDisplay
            />
          );
        }
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <div
      className={cn(
        "ForecastCard relative flex w-full min-w-0 flex-col gap-3 bg-gray-0 p-5 no-underline hover:shadow-lg active:shadow-md dark:bg-gray-0-dark xs:rounded-md",
        className
      )}
    >
      <Link
        href={getPostLink(post)}
        className="absolute inset-0"
        target={navigateToNewTab ? "_blank" : "_self"}
      />
      <div className="ForecastCard-header flex items-start justify-between max-[288px]:flex-col">
        {!post.conditional && (
          <h2
            className="ForecastTitle m-0 text-lg font-medium leading-snug tracking-normal"
            style={embedTheme?.title}
          >
            {embedTitle ? embedTitle : post.title}
          </h2>
        )}
        {renderPrediction()}
      </div>
      <div
        ref={chartContainerRef}
        className={cn(
          "ForecastCard-graph-container flex size-full min-h-[120px] min-w-0 flex-1",
          post.conditional ? "items-center" : "items-start"
        )}
      >
        {renderChart()}
      </div>
    </div>
  );
};

export default memo(ForecastCard);
