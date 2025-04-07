import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import { QuestionStatus } from "@/types/post";
import { Question } from "@/types/question";
import { getPostLink } from "@/utils/navigation";
import { ANNULLED_RESOLUTION, formatResolution } from "@/utils/questions";

type Props = {
  condition: Question;
  question: Question;
};

const ForecastMakerConditionalResolutionMessage: FC<Props> = ({
  question,
  condition,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const { status, resolution } = question;

  if (status != QuestionStatus.RESOLVED) return null;

  return (
    <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
      <p className="my-1 text-center text-base">
        {resolution === ANNULLED_RESOLUTION ? (
          t.rich("conditionalBranchResolutionAnnulled", {
            resolution: () => (
              <strong
                className="text-purple-800 dark:text-purple-800-dark"
                suppressHydrationWarning
              >
                {formatResolution({
                  resolution: condition.resolution,
                  questionType: condition.type,
                  locale,
                  actual_resolve_time: condition.actual_resolve_time ?? null,
                })}
              </strong>
            ),
            link: (child) => (
              <Link href={getPostLink({ id: condition.post_id }, condition.id)}>
                {child}
              </Link>
            ),
          })
        ) : (
          <>
            {t("resolutionDescriptionContinuous")}{" "}
            <strong
              className="text-purple-800 dark:text-purple-800-dark"
              suppressHydrationWarning
            >
              {formatResolution({
                resolution: question.resolution,
                questionType: question.type,
                locale,
                scaling: question.scaling,
                actual_resolve_time: question.actual_resolve_time ?? null,
                unit: question.unit,
              })}
            </strong>
          </>
        )}
      </p>
    </div>
  );
};

export default ForecastMakerConditionalResolutionMessage;
