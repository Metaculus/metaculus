"use client";
import classNames from "classnames";
import Link from "next/link";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import { EmbedTheme } from "@/app/(embed)/questions/constants/embed_theme";
import MultipleChoiceChartCard from "@/app/(main)/questions/[id]/components/detailed_question_card/multiple_choice_chart_card";
import MultipleChoiceGroupChart from "@/app/(main)/questions/[id]/components/multiple_choice_group_chart";
import FanChart from "@/components/charts/fan_chart";
import NumericChart from "@/components/charts/numeric_chart";
import ConditionalTile from "@/components/conditional_tile";
import PredictionChip from "@/components/prediction_chip";
import {
  GroupOfQuestionsGraphType,
  TimelineChartZoomOption,
} from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromMultipleChoiceForecast,
  getFanOptionsFromBinaryGroup,
  getFanOptionsFromContinuousGroup,
  getGroupQuestionsTimestamps,
  getNumericChartTypeFromQuestion,
} from "@/utils/charts";
import { getPostLink } from "@/utils/navigation";
import {
  getGroupCPRevealTime,
  getQuestionLinearChartType,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import CPRevealTime from "./charts/cp_reveal_time";

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
  const [cursorValue, setCursorValue] = useState<number | null>(null);
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

      if (!groupType) {
        return null;
      }

      const graphType = getQuestionLinearChartType(groupType);
      if (!graphType) {
        return null;
      }
      const { closestCPRevealTime, isCPRevealed } =
        getGroupCPRevealTime(questions);
      switch (post.group_of_questions.graph_type) {
        case GroupOfQuestionsGraphType.FanGraph: {
          const predictionQuestion =
            graphType === "continuous"
              ? getFanOptionsFromContinuousGroup(
                  questions as QuestionWithNumericForecasts[]
                )
              : getFanOptionsFromBinaryGroup(
                  questions as QuestionWithNumericForecasts[]
                );

          return (
            <FanChart
              options={predictionQuestion}
              height={chartHeight}
              withTooltip={!nonInteractive}
              extraTheme={embedTheme?.chart}
              isCPRevealed={isCPRevealed}
              cpRevealTime={closestCPRevealTime}
            />
          );
        }
        case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
          const sortedQuestions = sortGroupPredictionOptions(
            questions as QuestionWithNumericForecasts[]
          );
          const timestamps = getGroupQuestionsTimestamps(sortedQuestions);

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
              chartHeight={chartHeight}
              chartTheme={embedTheme?.chart}
              defaultZoom={defaultChartZoom}
              embedMode
              isCPRevealed={isCPRevealed}
              cpRevealTime={closestCPRevealTime}
            />
          );
        }
        default:
          return null;
      }
    }

    if (post.conditional) {
      return (
        <ConditionalTile
          postTitle={post.title}
          conditional={post.conditional}
          curationStatus={post.status}
          chartTheme={embedTheme?.chart}
        />
      );
    }

    if (post.question) {
      const { question } = post;
      const isCPRevealed = question.cp_reveal_time
        ? new Date(question.cp_reveal_time) <= new Date()
        : true;
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
                  getNumericChartTypeFromQuestion(question.type) ??
                  QuestionType.Numeric
                }
                actualCloseTime={
                  question.actual_close_time
                    ? new Date(question.actual_close_time).getTime()
                    : null
                }
                scaling={question.scaling}
                onCursorChange={
                  nonInteractive || !isCPRevealed ? undefined : setCursorValue
                }
                extraTheme={embedTheme?.chart}
                defaultZoom={defaultChartZoom}
                withZoomPicker={withZoomPicker}
                isCPRevealed={isCPRevealed}
                openTime={
                  question.open_time
                    ? new Date(question.open_time).getTime()
                    : undefined
                }
              />
              {!isCPRevealed && (
                <CPRevealTime
                  cpRevealTime={question.cp_reveal_time}
                  className="!justify-end pr-10 text-xs md:text-sm"
                />
              )}
            </div>
          );
        case QuestionType.MultipleChoice:
          return (
            <MultipleChoiceChartCard
              question={question}
              embedMode
              chartHeight={chartHeight}
              chartTheme={embedTheme?.chart}
              defaultZoom={defaultChartZoom}
              isCPRevealed={isCPRevealed}
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
          const cursorIndex = cursorValue
            ? question.aggregations.recency_weighted.history.findIndex(
                (forecast) => forecast.start_time === cursorValue
              )
            : null;
          const forecast =
            cursorIndex !== null && cursorIndex !== -1
              ? question.aggregations.recency_weighted.history[cursorIndex]
              : question.aggregations.recency_weighted.latest ?? undefined;

          return (
            <PredictionChip
              question={question}
              status={post.status}
              prediction={forecast?.centers![forecast.centers!.length - 1]}
              className="ForecastCard-prediction"
              unresovledChipStyle={embedTheme?.predictionChip}
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
      className={classNames(
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
        className={classNames(
          "ForecastCard-graph-container flex size-full min-h-[120px] min-w-0 flex-1",
          post.conditional ? "items-center" : "items-start"
        )}
      >
        {renderChart()}
      </div>
    </div>
  );
};

export default ForecastCard;
