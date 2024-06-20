"use client";
import Link from "next/link";
import { FC, useState } from "react";

import FanChart from "@/components/charts/fan_chart";
import NumericChart from "@/components/charts/numeric_chart";
import PredictionChip from "@/components/prediction_chip";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  getFanOptionsFromNumericGroup,
  getNumericChartTypeFromQuestion,
} from "@/utils/charts";

const CHART_HEIGHT = 170;

type Props = {
  post: PostWithForecasts;
};

const QuestionCarouselItem: FC<Props> = ({ post }) => {
  const [cursorValue, setCursorValue] = useState<number | null>(null);

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
            <FanChart options={predictionQuestion} height={CHART_HEIGHT} />
          );
        }
        default:
          return null;
      }
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
              height={CHART_HEIGHT}
              type={getNumericChartTypeFromQuestion(question.type)}
              onCursorChange={setCursorValue}
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
              ? question.forecasts.values_mean[cursorIndex]
              : question.forecasts.values_mean.at(-1) ?? undefined;

          return (
            <PredictionChip
              questionType={question.type}
              status={post.curation_status}
              prediction={prediction}
              resolution={question.resolution}
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
    <Link
      href={`/questions/${post.id}`}
      className="flex w-full min-w-0 flex-col gap-3 bg-gray-0 p-5 no-underline hover:shadow-lg active:shadow-md dark:bg-gray-0-dark xs:rounded-md"
    >
      <div className="flex items-start justify-between max-[288px]:flex-col">
        <h2 className="mb-0.5 mt-0 line-clamp-2 text-lg font-medium leading-snug tracking-normal max-[288px]:mb-0 sm:mb-2 md:mb-5">
          {post.title}
        </h2>
        {renderPrediction()}
      </div>
      <div className="flex size-full min-h-[120px] min-w-0 items-start">
        {renderChart()}
      </div>
    </Link>
  );
};

export default QuestionCarouselItem;
