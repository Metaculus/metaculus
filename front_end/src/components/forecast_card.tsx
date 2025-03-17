"use client";
import Link from "next/link";
import { FC, memo, useEffect, useMemo, useRef, useState } from "react";

import { EmbedTheme } from "@/app/(embed)/questions/constants/embed_theme";
import DetailedMultipleChoiceChartCard from "@/app/(main)/questions/[id]/components/detailed_question_card/multiple_choice_chart_card";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import FanChart from "@/components/charts/fan_chart";
import NumericChart from "@/components/charts/numeric_chart";
import ConditionalTile from "@/components/conditional_tile";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import PredictionChip from "@/components/prediction_chip";
import {
  GroupOfQuestionsGraphType,
  TimelineChartZoomOption,
} from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  getFanOptionsFromBinaryGroup,
  getFanOptionsFromContinuousGroup,
  getGroupQuestionsTimestamps,
  getContinuousChartTypeFromQuestion,
  getCursorForecast,
} from "@/utils/charts";
import cn from "@/utils/cn";
import { getPostLink } from "@/utils/navigation";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
  getQuestionLinearChartType,
  isConditionalPost,
  sortGroupPredictionOptions,
} from "@/utils/questions";

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
      const { questions } = post.group_of_questions;
      const groupType = questions.at(0)?.type;

      const sortedQuestions = sortGroupPredictionOptions(
        questions as QuestionWithNumericForecasts[],
        post.group_of_questions
      );

      if (!groupType) {
        return null;
      }

      const graphType = getQuestionLinearChartType(groupType);
      if (!graphType) {
        return null;
      }
      const forecastAvailability = getGroupForecastAvailability(questions);
      switch (post.group_of_questions.graph_type) {
        case GroupOfQuestionsGraphType.FanGraph: {
          const predictionQuestion =
            graphType === "continuous"
              ? getFanOptionsFromContinuousGroup(
                  sortedQuestions as QuestionWithNumericForecasts[]
                )
              : getFanOptionsFromBinaryGroup(
                  sortedQuestions as QuestionWithNumericForecasts[]
                );

          return (
            <FanChart
              options={predictionQuestion}
              height={chartHeight}
              withTooltip={!nonInteractive}
              extraTheme={embedTheme?.chart}
              forecastAvailability={forecastAvailability}
            />
          );
        }
        case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
          const timestamps = getGroupQuestionsTimestamps(sortedQuestions, {
            withUserTimestamps: !!forecastAvailability.cpRevealsOn,
          });

          return (
            <MultipleChoiceGroupChart
              type={graphType}
              questions={sortedQuestions}
              timestamps={timestamps}
              actualCloseTime={
                post.actual_close_time
                  ? new Date(post.actual_close_time).getTime()
                  : null
              }
              openTime={
                post.open_time ? new Date(post.open_time).getTime() : undefined
              }
              chartHeight={chartHeight}
              chartTheme={embedTheme?.chart}
              defaultZoom={defaultChartZoom}
              embedMode
              forecastAvailability={forecastAvailability}
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
        case QuestionType.Date:
          return (
            <div className="relative flex w-full flex-col">
              <NumericChart
                aggregation={question.aggregations.recency_weighted}
                myForecasts={question.my_forecasts}
                resolution={question.resolution}
                resolveTime={question.actual_resolve_time}
                height={chartHeight}
                questionType={
                  getContinuousChartTypeFromQuestion(question.type) ??
                  QuestionType.Numeric
                }
                actualCloseTime={
                  question.actual_close_time
                    ? new Date(question.actual_close_time).getTime()
                    : null
                }
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
                openTime={
                  question.open_time
                    ? new Date(question.open_time).getTime()
                    : undefined
                }
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
        case QuestionType.Date: {
          const cursorForecast = getCursorForecast(
            cursorTimestamp,
            question.aggregations.recency_weighted
          );

          return (
            <PredictionChip
              question={question}
              status={post.status}
              prediction={cursorForecast?.centers?.at(-1)}
              className="ForecastCard-prediction"
              unresovledChipStyle={embedTheme?.predictionChip}
              compact
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
