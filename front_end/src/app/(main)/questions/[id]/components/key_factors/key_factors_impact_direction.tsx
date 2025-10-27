"use client";

import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import RichText from "@/components/rich_text";
import { ImpactDirectionCategory } from "@/types/comment";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  impact: ImpactDirectionCategory;
  className?: string;
  option?: string;
  unit?: string;
  isCompact?: boolean;
};

export const convertNumericImpactToDirectionCategory = (
  impactDirection: -1 | 1 | null,
  certainty: -1 | null,
  questionType: QuestionType
): ImpactDirectionCategory | null => {
  if (certainty === -1) {
    return ImpactDirectionCategory.IncreaseUncertainty;
  }

  switch (questionType) {
    case QuestionType.Binary:
    case QuestionType.MultipleChoice:
      return impactDirection === -1
        ? ImpactDirectionCategory.Decrease
        : ImpactDirectionCategory.Increase;

    case QuestionType.Numeric:
    case QuestionType.Discrete:
      return impactDirection === -1
        ? ImpactDirectionCategory.Less
        : ImpactDirectionCategory.More;

    case QuestionType.Date:
      return impactDirection === -1
        ? ImpactDirectionCategory.Earlier
        : ImpactDirectionCategory.Later;

    default:
      return null;
  }
};

export const KeyFactorImpactDirectionLabel: FC<Props> = ({
  impact,
  className,
  option,
  unit,
}) => {
  const t = useTranslations();

  const IMPACT_CONFIG = {
    [ImpactDirectionCategory.Increase]: {
      icon: <FontAwesomeIcon icon={faArrowUp} />,
      textKey: "increasesLikelihood",
      color: "text-olive-800 dark:text-olive-800-dark",
    },
    [ImpactDirectionCategory.Decrease]: {
      icon: <FontAwesomeIcon icon={faArrowDown} />,
      textKey: "decreasesLikelihood",
      color: "text-salmon-700 dark:text-salmon-700-dark",
    },
    [ImpactDirectionCategory.More]: {
      icon: <FontAwesomeIcon icon={faArrowUp} />,
      textKey: "more",
      color: "text-olive-800 dark:text-olive-800-dark",
    },
    [ImpactDirectionCategory.Less]: {
      icon: <FontAwesomeIcon icon={faArrowDown} />,
      textKey: "less",
      color: "text-salmon-700 dark:text-salmon-700-dark",
    },
    [ImpactDirectionCategory.Earlier]: {
      icon: <FontAwesomeIcon icon={faArrowLeft} />,
      textKey: "earlier",
      color: "text-olive-800 dark:text-olive-800-dark",
    },
    [ImpactDirectionCategory.Later]: {
      icon: <FontAwesomeIcon icon={faArrowRight} />,
      textKey: "later",
      color: "text-salmon-700 dark:text-salmon-700-dark",
    },
    [ImpactDirectionCategory.IncreaseUncertainty]: {
      icon: (
        <div className="flex gap-0.5 text-[8px]">
          <FontAwesomeIcon icon={faArrowLeft} />
          <FontAwesomeIcon icon={faArrowRight} />
        </div>
      ),
      textKey: "increasesUncertainty",
      color: "text-blue-700 dark:text-blue-700-dark",
    },
  } as const;

  const { icon, textKey, color } = IMPACT_CONFIG[impact];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-lg text-xs",
        color,
        className
      )}
    >
      {icon}
      <span>
        {t(textKey)}
        {impact !== ImpactDirectionCategory.IncreaseUncertainty && unit && (
          <>&nbsp;{unit}</>
        )}
        {option && (
          <>
            &nbsp;
            <RichText>
              {(tags) =>
                t.rich("forOption", {
                  ...tags,
                  option,
                })
              }
            </RichText>
          </>
        )}
      </span>
    </div>
  );
};

const KeyFactorImpactDirectionContainer: FC<Props> = ({
  className,
  isCompact,
  ...props
}) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1.5 leading-tight">
      <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("impact")}
      </div>
      <KeyFactorImpactDirectionLabel
        className={cn(className, {
          "text-[10px]": isCompact,
        })}
        {...props}
      />
    </div>
  );
};

export default KeyFactorImpactDirectionContainer;
