import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { ForecastAvailability, QuestionType } from "@/types/question";
import { formatResolution, isSuccessfullyResolved } from "@/utils/questions";

import QuestionForecastChip from "./question_forecast_chip";
import QuestionResolutionChip from "./question_resolution_chip";
import UpcomingCP from "./upcoming_cp";

type Props = {
  post: PostWithForecasts;
  forecastAvailability?: ForecastAvailability | null;
};

const ConsumerPredictionInfo: FC<Props> = ({ post, forecastAvailability }) => {
  const { question, group_of_questions } = post;
  const locale = useLocale();

  // CP empty
  if (forecastAvailability?.isEmpty) {
    return null;
  }
  // CP hidden
  if (!isNil(forecastAvailability?.cpRevealsOn)) {
    return <UpcomingCP cpRevealsOn={forecastAvailability.cpRevealsOn} />;
  }

  // TODO: implement view for group and MC questions
  if (group_of_questions || question?.type === QuestionType.MultipleChoice) {
    return <div>Group or MC question</div>;
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
    return <QuestionForecastChip question={question} />;
  }
  return null;
};

export default ConsumerPredictionInfo;
