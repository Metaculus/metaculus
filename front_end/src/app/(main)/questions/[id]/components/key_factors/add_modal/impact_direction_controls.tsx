import { FC, useMemo } from "react";

import { KeyFactorImpactDirectionLabel } from "@/app/(main)/questions/[id]/components/key_factors/key_factors_impact_direction";
import LikelihoodButton from "@/app/(main)/questions/[id]/components/key_factors/likehood_button";
import { ImpactDirectionCategory, ImpactMetadata } from "@/types/comment";
import { QuestionType } from "@/types/question";

type ImpactDirectionControlsProps = {
  questionType: QuestionType;
  impact: { impact_direction: 1 | -1 | null; certainty: -1 | null } | null;
  onSelect: (impactMetadata: ImpactMetadata) => void;
  unit?: string;
};

type ButtonConfig =
  | {
      direction: 1 | -1;
      impact: ImpactDirectionCategory;
      variant: "green" | "red";
      certainty?: null;
    }
  | {
      direction: null;
      impact: ImpactDirectionCategory;
      variant: "neutral";
      certainty: -1;
    };

const ImpactDirectionControls: FC<ImpactDirectionControlsProps> = ({
  questionType,
  impact,
  onSelect,
  unit,
}) => {
  const certainty = impact?.certainty ?? null;
  const impact_direction = impact?.impact_direction ?? null;
  const impactMap: Record<
    "positive" | "negative",
    Partial<Record<QuestionType, ImpactDirectionCategory>> & {
      default: ImpactDirectionCategory;
    }
  > = {
    positive: {
      [QuestionType.Date]: ImpactDirectionCategory.Earlier,
      [QuestionType.Numeric]: ImpactDirectionCategory.More,
      [QuestionType.Discrete]: ImpactDirectionCategory.More,
      default: ImpactDirectionCategory.Increase,
    },
    negative: {
      [QuestionType.Date]: ImpactDirectionCategory.Later,
      [QuestionType.Numeric]: ImpactDirectionCategory.Less,
      [QuestionType.Discrete]: ImpactDirectionCategory.Less,
      default: ImpactDirectionCategory.Decrease,
    },
  };

  const includeUncertainty =
    questionType === QuestionType.Numeric ||
    questionType === QuestionType.Discrete ||
    questionType === QuestionType.Date;

  const buttons: ButtonConfig[] = useMemo(() => {
    const baseButtons: ButtonConfig[] = [
      {
        direction: 1,
        impact: impactMap.positive[questionType] ?? impactMap.positive.default,
        variant: "green",
        certainty: null,
      },
      {
        direction: -1,
        impact: impactMap.negative[questionType] ?? impactMap.negative.default,
        variant: "red",
        certainty: null,
      },
    ];

    return includeUncertainty
      ? [
          ...baseButtons,
          {
            direction: null,
            impact: ImpactDirectionCategory.IncreaseUncertainty,
            variant: "neutral",
            certainty: -1,
          },
        ]
      : baseButtons;
  }, [
    impactMap.positive,
    impactMap.negative,
    questionType,
    includeUncertainty,
  ]);

  return (
    <div className="flex flex-col items-start gap-1.5 sm:flex-row">
      {buttons.map(
        ({ direction, certainty: btnCertainty, impact, variant }) => (
          <LikelihoodButton
            key={impact}
            variant={variant}
            onClick={() => {
              if (btnCertainty === -1) {
                onSelect({ impact_direction: null, certainty: -1 });
              } else {
                onSelect({
                  impact_direction: direction as 1 | -1,
                  certainty: null,
                });
              }
            }}
            selected={
              (direction !== null && impact_direction === direction) ||
              (btnCertainty === -1 && certainty === -1)
            }
          >
            <KeyFactorImpactDirectionLabel
              impact={impact}
              unit={variant !== "neutral" ? unit : undefined}
              className="!text-inherit [font-size:inherit]"
            />
          </LikelihoodButton>
        )
      )}
    </div>
  );
};

export default ImpactDirectionControls;
