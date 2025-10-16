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
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  post: PostWithForecasts;
};

const KeyFactorDriver: FC<Props> = ({
  keyFactor,
  linkToComment = true,
  linkAnchor,
  isCompact,
  mode = "forecaster",
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

  const isCompactConsumer = mode === "consumer" && isCompact;

  return (
    <>
      {!isCompactConsumer && (
        <KeyFactorHeader
          username={keyFactor.author.username}
          linkAnchor={linkAnchor}
          linkToComment={linkToComment}
          label={t("driver")}
        />
      )}

      <KeyFactorText
        text={keyFactor.driver.text}
        className={cn("text-base leading-5", {
          "text-sm": mode === "consumer",
          "text-xs": isCompactConsumer,
        })}
      />

      {!isNil(directionCategory) && (
        <KeyFactorImpactDirectionContainer
          impact={directionCategory}
          option={keyFactor.question?.label ?? keyFactor.question_option}
          isCompact={isCompactConsumer}
        />
      )}

      {mode === "forecaster" && <hr className="my-0 opacity-20" />}

      <KeyFactorStrengthVoter
        keyFactorId={keyFactor.id}
        vote={keyFactor.vote}
        allowVotes={mode === "forecaster"}
        mode={mode}
      />
    </>
  );
};

export default KeyFactorDriver;
