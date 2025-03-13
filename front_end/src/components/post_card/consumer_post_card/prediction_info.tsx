import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import {
  ForecastAvailability,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  formatResolution,
  isGroupOfQuestionsPost,
  isMcQuestion,
  isSuccessfullyResolved,
} from "@/utils/questions";

import GroupForecastChart from "./group_forecast_chart";
import QuestionForecastChip from "./question_forecast_chip";
import QuestionResolutionChip from "./question_resolution_chip";
import UpcomingCP from "./upcoming_cp";

type Props = {
  post: PostWithForecasts;
  forecastAvailability?: ForecastAvailability | null;
};

const ConsumerPredictionInfo: FC<Props> = ({ post, forecastAvailability }) => {
  const { question } = post;
  const locale = useLocale();

  // CP hidden
  if (!isNil(forecastAvailability?.cpRevealsOn)) {
    return <UpcomingCP cpRevealsOn={forecastAvailability.cpRevealsOn} />;
  }

  // CP empty
  if (forecastAvailability?.isEmpty) {
    return null;
  }

  // TODO: implement view for numeric and date group questions
  if (isGroupOfQuestionsPost(post) || isMcQuestion(question)) {
    return <GroupForecastChart post={post} />;
  }

  if (question) {
    // Resolved/Annulled/Ambiguous
    if (question.resolution) {
      const formatedResolution = formatResolution(
        question.resolution,
        question.type,
        locale
      );
      const successfullResolution = isSuccessfullyResolved(question.resolution);
      return (
        <QuestionResolutionChip
          formatedResolution={formatedResolution}
          successfullResolution={successfullResolution}
        />
      );
    }

    // Open/Closed
    return (
      <QuestionForecastChip
        question={question as QuestionWithNumericForecasts}
      />
    );
  }
  return null;
};

export default ConsumerPredictionInfo;
