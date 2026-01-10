"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import KeyFactorDropdownMenuItems from "@/app/(main)/questions/[id]/components/key_factors/item_view/dropdown_menu_items";
import KeyFactorHeader from "@/app/(main)/questions/[id]/components/key_factors/item_view/key_factor_header";
import { ImpactMetadata, KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import { KeyFactorImpactDirectionLabel } from "../item_creation/driver/impact_direction_label";
import { convertNumericImpactToDirectionCategory } from "../utils";
import KeyFactorStrengthVoter from "./key_factor_strength_voter";

type Props = PropsWithChildren<{
  keyFactor: KeyFactor;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  projectPermission?: ProjectPermissions;
  label: string;
  impactMetadata: ImpactMetadata;
}>;

const KeyFactorStrengthItem: FC<Props> = ({
  keyFactor,
  isCompact,
  mode = "forecaster",
  projectPermission,
  label,
  children,
  impactMetadata,
}) => {
  const t = useTranslations();
  const { question_type: questionType, unit } = keyFactor.post;
  const directionCategory =
    questionType &&
    convertNumericImpactToDirectionCategory(
      impactMetadata.impact_direction,
      impactMetadata.certainty,
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
          label={label}
        />
      )}

      {children}

      {!isNil(directionCategory) && (
        <div className="flex flex-col gap-1.5 leading-tight">
          <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
            {t("impact")}
          </div>
          <KeyFactorImpactDirectionLabel
            className={cn({
              "text-[10px]": isCompactConsumer,
            })}
            unit={unit || keyFactor.question?.unit || undefined}
            option={
              keyFactor.question_option?.trim() ||
              keyFactor.question?.label ||
              undefined
            }
            impact={directionCategory}
          />
        </div>
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

export default KeyFactorStrengthItem;
