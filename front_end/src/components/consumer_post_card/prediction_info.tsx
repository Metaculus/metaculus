import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import QuestionCPMovement from "@/components/cp_movement";
import { PostWithForecasts } from "@/types/post";
import {
  ForecastAvailability,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
} from "@/utils/questions/helpers";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

import GroupForecastCard from "./group_forecast_card";
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

  if (isGroupOfQuestionsPost(post) || isMultipleChoicePost(post)) {
    return <GroupForecastCard post={post} />;
  }

  if (question) {
    // Resolved/Annulled/Ambiguous
    if (question.resolution) {
      const formatedResolution = formatResolution({
        resolution: question.resolution,
        questionType: question.type,
        scaling: question.scaling,
        locale,
        unit: question.unit,
        actual_resolve_time: question.actual_resolve_time ?? null,
        completeBounds: true,
        longBounds: true,
      });
      const successfullyResolved = isSuccessfullyResolved(question.resolution);
      return (
        <QuestionResolutionChip
          formatedResolution={formatedResolution}
          successfullyResolved={successfullyResolved}
          unit={question.unit}
        />
      );
    }

    // Open/Closed
    return (
      <div className="flex max-w-[200px] flex-col items-center justify-center gap-3">
        <QuestionForecastChip
          question={question as QuestionWithNumericForecasts}
        />
        <QuestionCPMovement question={question} presentation="consumerView" />
      </div>
    );
  }
  return null;
};

export default ConsumerPredictionInfo;
