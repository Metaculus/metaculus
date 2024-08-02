"use client";
import classNames from "classnames";
import Link from "next/link";
import { FC, useEffect, useRef, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import FanChart from "@/components/charts/fan_chart";
import NumericChart from "@/components/charts/numeric_chart";
import ConditionalTile from "@/components/conditional_tile";
import MultipleChoiceTile from "@/components/multiple_choice_tile";
import PredictionChip from "@/components/prediction_chip";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromBinaryGroup,
  generateChoiceItemsFromMultipleChoiceForecast,
  getFanOptionsFromNumericGroup,
  getGroupQuestionsTimestamps,
  getNumericChartTypeFromQuestion,
} from "@/utils/charts";
import { sortGroupPredictionOptions } from "@/utils/questions";

type Props = {
  post: PostWithForecasts;
  className?: string;
  chartTheme?: VictoryThemeDefinition;
  defaultChartZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  nonInteractive?: boolean;
  navigateToNewTab?: boolean;
};

const ForecastCard: FC<Props> = ({
  post,
  className,
  chartTheme,
  defaultChartZoom,
  withZoomPicker,
  nonInteractive = false,
  navigateToNewTab,
}) => {
  const [cursorValue, setCursorValue] = useState<number | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartHeight, setChartHeight] = useState(0);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    setChartHeight(chartContainerRef.current?.clientHeight);
  }, []);

  const renderChart = () => {
    if (post.group_of_questions) {
      const { questions } = post.group_of_questions;
      const groupType = questions.at(0)?.type;

      if (!groupType) {
        return null;
      }

      switch (groupType) {
        case QuestionType.Numeric:
        case QuestionType.Date: {
          const predictionQuestion = getFanOptionsFromNumericGroup(
            questions as QuestionWithNumericForecasts[]
          );
          return (
            <FanChart
              options={predictionQuestion}
              height={chartHeight}
              withTooltip={!nonInteractive}
              extraTheme={chartTheme}
            />
          );
        }
        case QuestionType.Binary:
          const visibleChoicesCount = 3;
          const sortedQuestions = sortGroupPredictionOptions(
            questions as QuestionWithNumericForecasts[]
          );
          const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
          const choices = generateChoiceItemsFromBinaryGroup(sortedQuestions, {
            activeCount: visibleChoicesCount,
          });
          return (
            <MultipleChoiceTile
              choices={choices}
              timestamps={timestamps}
              visibleChoicesCount={visibleChoicesCount}
              chartHeight={chartHeight}
              chartTheme={chartTheme}
              defaultChartZoom={defaultChartZoom}
              withZoomPicker={withZoomPicker}
            />
          );
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
          chartTheme={chartTheme}
        />
      );
    }

    if (post.question) {
      const { question } = post;

      switch (question.type) {
        case QuestionType.Binary:
        case QuestionType.Numeric:
        case QuestionType.Date:
          return (
            <NumericChart
              dataset={question.forecasts}
              height={chartHeight}
              questionType={
                getNumericChartTypeFromQuestion(question.type) ??
                QuestionType.Numeric
              }
              rangeMin={question.range_min}
              rangeMax={question.range_max}
              zeroPoint={question.zero_point}
              onCursorChange={nonInteractive ? undefined : setCursorValue}
              extraTheme={chartTheme}
              defaultZoom={defaultChartZoom}
              withZoomPicker={withZoomPicker}
            />
          );
        case QuestionType.MultipleChoice:
          const visibleChoicesCount = 3;
          const choices = generateChoiceItemsFromMultipleChoiceForecast(
            question,
            {
              activeCount: visibleChoicesCount,
            }
          );
          return (
            <MultipleChoiceTile
              choices={choices}
              timestamps={question.forecasts.timestamps}
              visibleChoicesCount={visibleChoicesCount}
              chartHeight={chartHeight}
              chartTheme={chartTheme}
              defaultChartZoom={defaultChartZoom}
              withZoomPicker={withZoomPicker}
              question={question}
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
            ? question.forecasts.timestamps.findIndex((t) => t === cursorValue)
            : null;

          const prediction =
            cursorIndex !== null && cursorIndex !== -1
              ? question.forecasts.medians[cursorIndex]
              : question.forecasts.medians.at(-1) ?? undefined;

          return (
            <PredictionChip
              question={question}
              status={post.status}
              prediction={prediction}
              className="ForecastCard-prediction"
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
        href={`/questions/${post.id}`}
        className="absolute inset-0"
        target={navigateToNewTab ? "_blank" : "_self"}
      />
      <div className="ForecastCard-header flex items-start justify-between max-[288px]:flex-col">
        {!post.conditional && (
          <h2 className="ForecastTitle m-0 line-clamp-2 text-lg font-medium leading-snug tracking-normal">
            {post.title}
          </h2>
        )}
        {renderPrediction()}
      </div>
      <div
        ref={chartContainerRef}
        className={classNames(
          "ForecastCard-graph-container flex size-full min-h-[120px] min-w-0 flex-1 items-start"
        )}
      >
        {renderChart()}
      </div>
    </div>
  );
};

export default ForecastCard;
