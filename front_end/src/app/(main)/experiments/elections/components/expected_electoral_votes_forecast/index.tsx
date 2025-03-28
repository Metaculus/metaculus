import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import ExperimentCandleBarGraph from "@/app/(main)/experiments/components/experiment_candle_bar_graph";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import Button from "@/components/ui/button";
import PostsApi from "@/services/posts";
import { Candle } from "@/types/experiments";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { computeQuartilesFromCDF } from "@/utils/math";

type Props = {
  democratPostId: number;
  republicanPostId: number;
};

const ExpectedElectoralVotesForecast: FC<Props> = async ({
  democratPostId,
  republicanPostId,
}) => {
  const t = await getTranslations();
  const [democratPost, republicanPost] = await Promise.all([
    PostsApi.getPostAnonymous(democratPostId, { next: { revalidate: 900 } }),
    PostsApi.getPostAnonymous(republicanPostId, { next: { revalidate: 900 } }),
  ]);
  if (!democratPost?.question || !republicanPost?.question) {
    return null;
  }

  const { candles, democratPrediction, republicanPrediction } =
    getForecastData(democratPost.question, republicanPost.question) ?? {};

  return (
    <div className="relative mt-4 flex w-full flex-col rounded bg-gray-0 p-4 dark:bg-gray-0-dark">
      <div className="absolute left-2/4 top-5 hidden -translate-x-2/4 text-xs text-blue-700 opacity-75 dark:text-blue-700-dark md:block">
        ({t("270VotesToWin")})
      </div>
      <div className="absolute right-5 top-5 hidden text-xs text-blue-700 opacity-75 dark:text-blue-700-dark min-[400px]:block md:hidden">
        ({t("270VotesToWin")})
      </div>
      <span className="text-lg text-gray-700 dark:text-gray-700-dark">
        {t("expectedElectoralVotes")}
      </span>
      <div className="relative mt-3 flex w-full justify-between md:mt-0">
        <span className="absolute left-0 top-[51px] text-blue-700 opacity-65 dark:text-blue-700-dark">
          {t("0Votes")}
        </span>
        <span className="absolute right-0 top-[51px] text-blue-700 opacity-65 dark:text-blue-700-dark">
          {t("538Votes")}
        </span>
        <span
          className={cn(
            "absolute left-2/4 top-[45px] z-10 mt-[-16px] h-[58px] w-[2px] -translate-x-2/4 bg-gray-400 mix-blend-luminosity dark:bg-gray-500"
          )}
        />
        <div className="mb-3 flex w-full items-center justify-center gap-2 pl-5 text-base text-[#0252A5] dark:text-[#A7C3DC]">
          <div className="flex items-center gap-2 capitalize">
            <span className="font-bold">{democratPrediction}</span>
            {t("democrat")}
          </div>
          <Button
            aria-label={t("democratElectoralVote")}
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
        <div className="flex items-center gap-2 capitalize">
          <span className="font-bold">{republicanPrediction}</span>
          {t("republican")}
        </div>
        <Button
          aria-label={t("republicanElectoralVote")}
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
  const latest_democrat = democratQuestion.aggregations.recency_weighted.latest;
  if (!latest_democrat) {
    return null;
  }

  const latest_republican =
    republicanQuestion.aggregations.recency_weighted.latest;
  if (!latest_republican) {
    return null;
  }

  const democratQuartiles = computeQuartilesFromCDF(
    latest_democrat?.forecast_values,
    true
  );
  const republicanQuartiles = computeQuartilesFromCDF(
    latest_republican.forecast_values,
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
  const democratPrediction = latest_democrat?.centers?.[0];
  const republicanPrediction = latest_republican?.centers?.[0];

  return {
    candles,
    democratPrediction: democratPrediction
      ? getDisplayValue({
          value: democratPrediction,
          questionType: democratQuestion.type,
          scaling: democratQuestion.scaling,
          actual_resolve_time: democratQuestion.actual_resolve_time ?? null,
        })
      : undefined,
    republicanPrediction: republicanPrediction
      ? getDisplayValue({
          value: republicanPrediction,
          questionType: republicanQuestion.type,
          scaling: republicanQuestion.scaling,
          actual_resolve_time: republicanQuestion.actual_resolve_time ?? null,
        })
      : undefined,
  };
}

export default WithServerComponentErrorBoundary(ExpectedElectoralVotesForecast);
