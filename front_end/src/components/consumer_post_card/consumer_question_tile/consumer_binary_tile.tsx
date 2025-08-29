import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import UpcomingCP from "@/components/consumer_post_card/upcoming_cp";
import QuestionCPMovement from "@/components/cp_movement";
import {
  ForecastAvailability,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";
import { isSuccessfullyResolved } from "@/utils/questions/resolution";

type Props = {
  question: QuestionWithForecasts;
  forecastAvailability: ForecastAvailability;
};

const ConsumerBinaryTile: FC<Props> = ({ question, forecastAvailability }) => {
  const locale = useLocale();

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
        presentation="consumerView"
      />
    );
  }

  return (
    <div className="flex max-w-[200px] flex-col items-center justify-center gap-3">
      <BinaryCPBar question={question as QuestionWithNumericForecasts} />
      <QuestionCPMovement question={question} unit={"%"} boldValueUnit={true} />
      {!isNil(forecastAvailability?.cpRevealsOn) && (
        <UpcomingCP
          cpRevealsOn={forecastAvailability.cpRevealsOn}
          className="mt-4 text-sm font-normal text-gray-600 dark:text-gray-600-dark"
        />
      )}
    </div>
  );
};

export default ConsumerBinaryTile;
