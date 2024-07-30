import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import Link from "next/link";
import { FC } from "react";

import ElectionsEmbedModal from "@/app/(main)/experiments/elections/components/elections_embed_modal";
import Button from "@/components/ui/button";
import PostsApi from "@/services/posts";
import { StateByForecastItem } from "@/types/experiments";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { extractQuestionGroupName } from "@/utils/questions";

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
  const post = await PostsApi.getPost(questionGroupId);
  if (!post?.group_of_questions) {
    return null;
  }

  let democratPrediction = null;
  let republicanPrediction = null;
  if (democratPostId && republicanPostId) {
    const [demPost, repPost] = await Promise.all([
      PostsApi.getPost(democratPostId),
      PostsApi.getPost(republicanPostId),
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
            className={classNames("absolute left-2/4 -translate-x-2/4")}
          />
          <div className="flex w-full justify-between">
            {democratPrediction && (
              <div className="svgTextDemocrat">
                {`Democrat`}
                <br />
                <span className="svgTextSubtitle">
                  {democratPrediction} votes
                </span>
              </div>
            )}
            {republicanPrediction && (
              <div className="svgTextRepublican">
                {`Republican`}
                <br />
                <span className="svgTextSubtitle mt-1">
                  {republicanPrediction} votes
                </span>
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
          <span>State-by-state Forecasts</span>
          <Button
            aria-label="Republican Electoral Vote"
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

      <div className="mt-2 flex w-full flex-col gap-2 self-center text-left font-sans font-light md:mt-8 lg:gap-7">
        <div className="w-full  border-b border-blue-400 dark:border-blue-400-dark" />

        <div className="flex flex-col gap-4">
          <div className="text-sm leading-5 text-gray-600 dark:text-gray-600-dark">
            <span className="font-semibold">
              Currently, our map focuses only on the battleground states
              outlined{" "}
              <Link
                href={`/questions/${post.id}`}
                className="hover:text-blue-800 dark:hover:text-blue-800-dark"
              >
                in this question
              </Link>
              .
            </span>{" "}
            We marked some states “Safe Democrat” or “Safe Republican” based on
            historical election data. If you believe we should include forecasts
            for more states, let us know!
          </div>

          <div className="text-sm leading-5 text-gray-600 dark:text-gray-600-dark">
            <span className="font-semibold">Regarding Maine and Nebraska:</span>{" "}
            We’re aware of their unique approach to electoral vote distribution
            and are working to incorporate this in our upcoming updates. Stay
            tuned!
          </div>
        </div>
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
      [extractQuestionGroupName(q.title).toLowerCase()]: q,
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

    const prediction = questionData.forecasts.medians.at(-1);
    if (!prediction) {
      return area;
    }

    const forecastersNumber = questionData.forecasts.nr_forecasters.at(-1) ?? 0;
    const forecastsNumber = questionData.forecasts.timestamps.length;

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

  const rawDemocratPrediction = demQuestion.forecasts.medians.at(-1);
  const rawRepublicanPrediction = repQuestion.forecasts.medians.at(-1);

  return {
    democratPrediction: rawDemocratPrediction
      ? getDisplayValue(rawDemocratPrediction, demQuestion)
      : null,
    republicanPrediction: rawRepublicanPrediction
      ? getDisplayValue(rawRepublicanPrediction, repQuestion)
      : null,
  };
}

export default StateByForecast;
