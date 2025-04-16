import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import CPWeeklyMovement from "@/components/cp_weekly_movement";
import { PostWithForecasts } from "@/types/post";
import {
  ForecastAvailability,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  formatResolution,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isSuccessfullyResolved,
} from "@/utils/questions";

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
        <CPWeeklyMovement
          question={question}
          displayUnit={false}
          presentation="consumerView"
        />
      </div>
    );
  }
  return null;
};

export default ConsumerPredictionInfo;
