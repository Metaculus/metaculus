"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import KeyFactorHeader from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item/key_factor_header";
import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { inferEffectiveQuestionTypeFromPost } from "@/utils/questions/helpers";

import KeyFactorImpactDirectionContainer, {
  convertNumericImpactToDirectionCategory,
} from "../key_factors_impact_direction";
import KeyFactorStrengthVoter from "./key_factor_strength_voter";
import KeyFactorText from "./key_factor_text";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  linkAnchor: string;
  variant?: "default" | "compact";
  post: PostWithForecasts;
};

const KeyFactorDriver: FC<Props> = ({
  keyFactor,
  linkToComment = true,
  linkAnchor,
  variant = "default",
  post,
}) => {
  const t = useTranslations();
  const questionType = inferEffectiveQuestionTypeFromPost(post);
  const directionCategory =
    questionType &&
    keyFactor.driver.impact_direction &&
    convertNumericImpactToDirectionCategory(
      keyFactor.driver.impact_direction,
      questionType
    );

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark [&:hover_.target]:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment }
      )}
    >
      <KeyFactorHeader
        username={keyFactor.author.username}
        linkAnchor={linkAnchor}
        linkToComment={linkToComment}
        label={t("driver")}
      />

      <KeyFactorText
        text={keyFactor.driver.text}
        className="text-base leading-5"
      />

      {!isNil(directionCategory) && (
        <KeyFactorImpactDirectionContainer
          impact={directionCategory}
          option={keyFactor.question?.label ?? keyFactor.question_option}
        />
      )}

      <hr className="my-0 opacity-20" />

      <KeyFactorStrengthVoter
        keyFactorId={keyFactor.id}
        vote={keyFactor.vote}
      />
    </div>
  );
};

export default KeyFactorDriver;
