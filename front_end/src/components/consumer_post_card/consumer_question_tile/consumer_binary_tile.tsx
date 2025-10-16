import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionResolutionChip from "@/components/consumer_post_card/question_resolution_chip";
import UpcomingCP from "@/components/consumer_post_card/upcoming_cp";
import QuestionCPMovement from "@/components/cp_movement";
import { useHideCP } from "@/contexts/cp_context";
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
  const { hideCP } = useHideCP();
  const locale = useLocale();
  const t = useTranslations();

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
      {!isNil(forecastAvailability?.cpRevealsOn) && (
        <div className="flex min-w-[200px] max-w-[200px] flex-col justify-center gap-1 text-center">
          <div className="text-xs text-olive-700 dark:text-olive-700-dark md:text-sm">
            {t("currentEstimate")}
          </div>
          <div className="text-lg font-bold text-olive-900 dark:text-olive-900-dark">
            <UpcomingCP cpRevealsOn={forecastAvailability.cpRevealsOn} />
          </div>
        </div>
      )}

      <BinaryCPBar question={question as QuestionWithNumericForecasts} />

      {!hideCP && (
        <QuestionCPMovement
          question={question}
          unit={"%"}
          boldValueUnit={true}
        />
      )}
    </div>
  );
};

export default ConsumerBinaryTile;
