"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import KeyFactorDropdownMenuItems from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item/dropdown_menu_items";
import KeyFactorHeader from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item/key_factor_header";
import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorImpactDirectionContainer, {
  convertNumericImpactToDirectionCategory,
} from "../key_factors_impact_direction";
import KeyFactorStrengthVoter from "./key_factor_strength_voter";
import KeyFactorText from "./key_factor_text";

type Props = {
  keyFactor: KeyFactor;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  projectPermission?: ProjectPermissions;
};

const KeyFactorDriver: FC<Props> = ({
  keyFactor,
  isCompact,
  mode = "forecaster",
  projectPermission,
}) => {
  const { driver } = keyFactor;
  const t = useTranslations();
  const { question_type: questionType, unit } = keyFactor.post;
  const directionCategory =
    questionType &&
    convertNumericImpactToDirectionCategory(
      driver.impact_direction,
      driver.certainty,
      questionType
    );

  const isConsumer = mode === "consumer";
  const isCompactConsumer = isConsumer && isCompact;
  const footerControls = !isCompact ? (
    <KeyFactorDropdownMenuItems
      keyFactor={keyFactor}
      projectPermission={projectPermission}
    />
  ) : undefined;

  return (
    <>
      {!isConsumer && (
        <KeyFactorHeader
          username={keyFactor.author.username}
          linkAnchor={`#comment-${keyFactor.comment_id}`}
          label={t("driver")}
        />
      )}

      <KeyFactorText
        text={driver.text}
        className={cn("text-base leading-5", {
          "text-sm": isConsumer,
          "text-xs": isCompactConsumer,
        })}
      />

      {!isNil(directionCategory) && (
        <KeyFactorImpactDirectionContainer
          impact={directionCategory}
          option={
            keyFactor.question_option?.trim() ||
            keyFactor.question?.label ||
            undefined
          }
          isCompact={isCompactConsumer}
          unit={unit || keyFactor.question?.unit || undefined}
        />
      )}

      {mode === "forecaster" && <hr className="my-0 opacity-20" />}

      <KeyFactorStrengthVoter
        keyFactorId={keyFactor.id}
        vote={keyFactor.vote}
        allowVotes={mode === "forecaster"}
        mode={mode}
        footerControls={footerControls}
      />
    </>
  );
};

export default KeyFactorDriver;
