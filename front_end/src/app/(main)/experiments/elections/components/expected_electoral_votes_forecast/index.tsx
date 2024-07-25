import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { FC } from "react";

import ExperimentCandleBarGraph from "@/app/(main)/experiments/components/experiment_candle_bar_graph";
import Button from "@/components/ui/button";
import PostsApi from "@/services/posts";
import { Candle } from "@/types/experiments";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { formatPrediction } from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

type Props = {
  democratPostId: number;
  republicanPostId: number;
};

const ExpectedElectoralVotesForecast: FC<Props> = async ({
  democratPostId,
  republicanPostId,
}) => {
  const [democratPost, republicanPost] = await Promise.all([
    PostsApi.getPost(democratPostId),
    PostsApi.getPost(republicanPostId),
  ]);
  if (!democratPost?.question || !republicanPost?.question) {
    return null;
  }

  const { candles, democratPrediction, republicanPrediction } =
    getForecastData(democratPost.question, republicanPost.question) ?? {};

  return (
    <div className="relative mt-4 flex w-full flex-col rounded bg-gray-0 p-4 dark:bg-gray-0-dark">
      <div className="absolute left-2/4 top-5 hidden -translate-x-2/4 text-xs text-blue-700 opacity-75 dark:text-blue-700-dark md:block">
        (270 votes to win)
      </div>
      <div className="absolute right-5 top-5 hidden text-xs text-blue-700 opacity-75 dark:text-blue-700-dark min-[400px]:block md:hidden">
        (270 votes to win)
      </div>
      <span className="text-lg text-gray-700 dark:text-gray-700-dark">
        Expected Electoral Votes
      </span>
      <div className="relative mt-3 flex w-full justify-between md:mt-0">
        <span className="absolute left-0 top-[51px] text-blue-700 opacity-65 dark:text-blue-700-dark">
          0 votes
        </span>
        <span className="absolute right-0 top-[51px] text-blue-700 opacity-65 dark:text-blue-700-dark">
          538 votes
        </span>
        <span
          className={classNames(
            "absolute left-2/4 top-[45px] z-10 mt-[-16px] h-[58px] w-[2px] -translate-x-2/4 bg-gray-400 mix-blend-luminosity dark:bg-gray-500"
          )}
        />
        <div className="mb-3 flex w-full items-center justify-center gap-2 pl-5 text-base text-[#0252A5] dark:text-[#A7C3DC]">
          <div className="flex items-center gap-2">
            <span className="font-bold">{democratPrediction}</span>
            Democrat
          </div>
          <Button
            aria-label="Democrats Electoral Vote"
            variant="tertiary"
            size="sm"
            presentationType="icon"
            href={`/questions/${democratPost.question.id}`}
          >
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="text-[#0252A5] dark:text-[#A7C3DC]"
            />
          </Button>
        </div>
      </div>
      {!!candles && <ExperimentCandleBarGraph candles={candles} />}

      <div className="relative mt-3 flex w-full items-center justify-center gap-2 pl-5 text-base text-[#E0152B] dark:text-[#E7858F]">
        <div className="flex items-center gap-2">
          <span className="font-bold">{republicanPrediction}</span>
          Republican
        </div>
        <Button
          aria-label="Republican Electoral Vote"
          variant="tertiary"
          size="sm"
          presentationType="icon"
          href={`/questions/${republicanPost.question.id}`}
        >
          <FontAwesomeIcon
            icon={faArrowUpRightFromSquare}
            className="text-[#E0152B] dark:text-[#E7858F]"
          />
        </Button>
      </div>
    </div>
  );
};

type ForecastData = {
  candles: Candle[];
  democratPrediction?: string;
  republicanPrediction?: string;
};
function getForecastData(
  democratQuestion: QuestionWithForecasts,
  republicanQuestion: QuestionWithForecasts
): ForecastData | null {
  if (
    democratQuestion.type === QuestionType.MultipleChoice ||
    republicanQuestion.type === QuestionType.MultipleChoice
  ) {
    return null;
  }

  const democratQuartiles = computeQuartilesFromCDF(
    democratQuestion.forecasts.latest_cdf,
    true
  );
  const republicanQuartiles = computeQuartilesFromCDF(
    republicanQuestion.forecasts.latest_cdf,
    true
  );

  const candles = [
    {
      quartiles: democratQuartiles,
      color: "#0252A5",
    },
    {
      quartiles: republicanQuartiles,
      color: "#E0152B",
    },
  ];
  const democratPrediction = democratQuestion.forecasts.medians.at(-1);
  const republicanPrediction = republicanQuestion.forecasts.medians.at(-1);

  return {
    candles,
    democratPrediction: democratPrediction
      ? formatPrediction(democratPrediction, democratQuestion.type)
      : undefined,
    republicanPrediction: republicanPrediction
      ? formatPrediction(republicanPrediction, republicanQuestion.type)
      : undefined,
  };
}

export default ExpectedElectoralVotesForecast;
