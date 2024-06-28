import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FC } from "react";

import Button from "@/components/ui/button";
import PostsApi from "@/services/posts";
import { StateByForecastItem } from "@/types/experiments";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { extractQuestionGroupName } from "@/utils/questions";

import StateByForecastCharts from "./state_by_forecast_charts";
import { US_MAP_AREAS } from "./us_areas";

type Props = {
  questionGroupId: number;
};

const StateByForecast: FC<Props> = async ({ questionGroupId }) => {
  const post = await PostsApi.getPost(questionGroupId);
  if (!post?.group_of_questions) {
    return null;
  }

  const stateByItems = getStateByItems(
    post.id,
    post.group_of_questions.questions
  );

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
      </div>

      <StateByForecastCharts items={stateByItems} />
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

    const prediction = questionData.forecasts.values_mean.at(-1);
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

export default StateByForecast;
