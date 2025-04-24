import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import ElectionsEmbedModal from "@/app/(main)/experiments/elections/components/elections_embed_modal";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import Button from "@/components/ui/button";
import PostsApi from "@/services/posts";
import { StateByForecastItem } from "@/types/experiments";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

import MiddleVotesArrow from "./middle_votes_arrow";
import StateByForecastCharts from "./state_by_forecast_charts";
import { US_MAP_AREAS } from "./us_areas";

type Props = {
  questionGroupId: number;
  democratPostId?: number;
  republicanPostId?: number;
  isEmbed?: boolean;
};

const StateByForecast: FC<Props> = async ({
  questionGroupId,
  democratPostId,
  republicanPostId,
  isEmbed,
}) => {
  const t = await getTranslations();
  const post = await PostsApi.getPostAnonymous(questionGroupId, {
    next: { revalidate: 900 },
  });
  if (!post?.group_of_questions) {
    return null;
  }

  let democratPrediction = null;
  let republicanPrediction = null;
  if (democratPostId && republicanPostId) {
    const [demPost, repPost] = await Promise.all([
      PostsApi.getPostAnonymous(democratPostId),
      PostsApi.getPostAnonymous(republicanPostId),
    ]);
    const predictions = getDemocratRepublicanPrediction({ demPost, repPost });
    if (predictions) {
      democratPrediction = predictions.democratPrediction;
      republicanPrediction = predictions.republicanPrediction;
    }
  }

  const stateByItems = getStateByItems(
    post.id,
    post.group_of_questions.questions
  );

  if (isEmbed) {
    return (
      <div className="relative mt-20 inline-flex w-full flex-col">
        <div className="flex w-full flex-col">
          <MiddleVotesArrow
            className={cn("absolute left-2/4 -translate-x-2/4")}
          />
          <div className="flex w-full justify-between">
            {democratPrediction && (
              <div className="capitalize">
                {t("democrat")}
                <br />
                {t("numVotes", { num: democratPrediction })}
              </div>
            )}
            {republicanPrediction && (
              <div className="capitalize">
                {t("republican")}
                <br />
                {t("numVotes", { num: republicanPrediction })}
              </div>
            )}
          </div>
        </div>

        <StateByForecastCharts items={stateByItems} interactive={false} />
      </div>
    );
  }

  return (
    <div className="mt-4 flex w-full flex-col rounded bg-gray-0 p-4 dark:bg-gray-0-dark">
      <div className="mb-2 grid w-full grid-cols-[1fr_auto_1fr] gap-2">
        <Link
          className="col-start-2 row-span-1 row-start-1 flex items-center gap-2 text-lg text-gray-700 no-underline hover:text-gray-900 dark:text-gray-700-dark hover:dark:text-gray-900-dark md:col-start-1"
          href={`/questions/${post.id}`}
        >
          {t("stateByStateForecasts")}
          <Button
            aria-label={t("republicanElectoralVote")}
            variant="tertiary"
            presentationType="icon"
            size="sm"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
          </Button>
        </Link>

        <ElectionsEmbedModal />
      </div>

      <div className="relative mt-10 w-full md:mt-0">
        <MiddleVotesArrow className="absolute left-2/4 -translate-x-2/4 -translate-y-full" />
      </div>

      <StateByForecastCharts items={stateByItems} />

      <hr className="border-blue-400 dark:border-blue-400-dark" />

      <div className="font-sans text-sm font-light leading-5 text-gray-600 dark:text-gray-600-dark">
        {t.rich("electionHubDisclaimer", {
          bold: (chunks) => <span className="font-semibold">{chunks}</span>,
          link: (chunks) => (
            <Link
              href={`/questions/${post.id}`}
              className="font-semibold hover:text-blue-800 dark:hover:text-blue-800-dark"
            >
              {chunks}
            </Link>
          ),
        })}
      </div>
    </div>
  );
};

const getStateByItems = (
  postId: number,
  questions: QuestionWithForecasts[]
): StateByForecastItem[] => {
  const questionsDictionary = questions.reduce<
    Record<string, QuestionWithForecasts>
  >(
    (acc, q) => ({
      ...acc,
      [q.label.toLowerCase()]: q,
    }),
    {}
  );

  return US_MAP_AREAS.map((area) => {
    const questionData = questionsDictionary[area.name.toLowerCase()];

    if (!questionData) {
      // We have a winning probability only for a set of states, taken from one of our question
      // groups. This is the place where we take these probabilityes from the group subquestions
      // and annotate our list of states with the probability.
      // For the rest of states, where there's no corresponding sub-question, we look at the
      // existing probability (currently hardcoded to some number), and we assume them to be a
      // safe democrat or safe republican. Because the hardcoded probability we have is currently
      // still a probability number, we want to bring that to the extreme values, so it it's
      // probability represents a "Safe" win for the democrats or republicans.
      // This is of course a hack resulting from the data we have about the safe states, likely
      // will change if we introduce the rest of states (safe states) in a question on our
      // platform.
      const isSafeDem = area.democratProbability > 0.5;
      return { ...area, democratProbability: isSafeDem ? 0.999 : 0.001 };
    }

    if (questionData.type !== QuestionType.Binary) {
      return area;
    }

    const aggregation = questionData.aggregations.recency_weighted;
    const prediction = aggregation?.latest?.centers?.[0];
    if (!prediction) {
      return area;
    }

    const forecastersNumber = aggregation.latest?.forecaster_count;
    const forecastsNumber = aggregation.history.length;

    return {
      ...area,
      democratProbability: 1 - prediction,
      link: {
        groupId: postId,
        questionId: questionData.id,
      },
      forecastersNumber,
      forecastsNumber,
    };
  });
};

function getDemocratRepublicanPrediction({
  demPost,
  repPost,
}: {
  demPost: PostWithForecasts | null;
  repPost: PostWithForecasts | null;
}) {
  if (!demPost?.question || !repPost?.question) {
    return null;
  }
  const { question: demQuestion } = demPost;
  const { question: repQuestion } = repPost;

  if (
    demQuestion.type === QuestionType.MultipleChoice ||
    repQuestion.type === QuestionType.MultipleChoice
  ) {
    return null;
  }

  const rawDemocratPrediction =
    demQuestion?.aggregations?.recency_weighted?.latest?.centers?.[0];
  const rawRepublicanPrediction =
    repQuestion?.aggregations?.recency_weighted?.latest?.centers?.[0];

  return {
    democratPrediction: rawDemocratPrediction
      ? getPredictionDisplayValue(rawDemocratPrediction, {
          questionType: demQuestion.type,
          scaling: demQuestion.scaling,
          actual_resolve_time: demQuestion.actual_resolve_time ?? null,
        })
      : null,
    republicanPrediction: rawRepublicanPrediction
      ? getPredictionDisplayValue(rawRepublicanPrediction, {
          questionType: repQuestion.type,
          scaling: repQuestion.scaling,
          actual_resolve_time: repQuestion.actual_resolve_time ?? null,
        })
      : null,
  };
}

export default WithServerComponentErrorBoundary(StateByForecast);
