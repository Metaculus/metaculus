import { FC, useMemo } from "react";

import LikelihoodButton from "@/app/(main)/questions/[id]/components/key_factors/item_creation/driver/likehood_button";
import { ImpactDirectionCategory, ImpactMetadata } from "@/types/comment";
import { QuestionType } from "@/types/question";

import { KeyFactorImpactDirectionLabel } from "./impact_direction_label";

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

const generateButtons = (questionType: QuestionType): ButtonConfig[] => {
  switch (questionType) {
    case QuestionType.Date:
      return [
        // Please note: earlier is green, but direction is negative
        {
          direction: -1,
          impact: ImpactDirectionCategory.Earlier,
          variant: "green",
          certainty: null,
        },
        // Please note: later is red, but direction is positive
        {
          direction: 1,
          impact: ImpactDirectionCategory.Later,
          variant: "red",
          certainty: null,
        },
        {
          direction: null,
          impact: ImpactDirectionCategory.IncreaseUncertainty,
          variant: "neutral",
          certainty: -1,
        },
      ];
    case QuestionType.Numeric:
    case QuestionType.Discrete:
      return [
        {
          direction: 1,
          impact: ImpactDirectionCategory.More,
          variant: "green",
          certainty: null,
        },
        {
          direction: -1,
          impact: ImpactDirectionCategory.Less,
          variant: "red",
          certainty: null,
        },
        {
          direction: null,
          impact: ImpactDirectionCategory.IncreaseUncertainty,
          variant: "neutral",
          certainty: -1,
        },
      ];
    default:
      return [
        {
          direction: 1,
          impact: ImpactDirectionCategory.Increase,
          variant: "green",
          certainty: null,
        },
        {
          direction: -1,
          impact: ImpactDirectionCategory.Decrease,
          variant: "red",
          certainty: null,
        },
      ];
  }
};

const ImpactDirectionControls: FC<ImpactDirectionControlsProps> = ({
  questionType,
  impact,
  onSelect,
  unit,
}) => {
  const certainty = impact?.certainty ?? null;
  const impact_direction = impact?.impact_direction ?? null;

  const buttons: ButtonConfig[] = useMemo(
    () => generateButtons(questionType),
    [questionType]
  );

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
