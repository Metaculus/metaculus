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

import { ImpactDirection } from "@/types/comment";
import cn from "@/utils/core/cn";

type Props = {
  impact: ImpactDirection;
  className?: string;
};

const KeyFactorDirectionImpact: FC<Props> = ({ impact, className }) => {
  const t = useTranslations();

  const IMPACT_CONFIG = {
    [ImpactDirection.Increase]: {
      icon: <FontAwesomeIcon icon={faArrowUp} />,
      textKey: "increasesLikelihood",
      color: "text-olive-800 dark:text-olive-800-dark",
    },
    [ImpactDirection.Decrease]: {
      icon: <FontAwesomeIcon icon={faArrowDown} />,
      textKey: "decreasesLikelihood",
      color: "text-salmon-700 dark:text-salmon-700-dark",
    },
    [ImpactDirection.IncreaseUncertainty]: {
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
        className,
        color
      )}
    >
      {icon}
      <span>{t(textKey)}</span>
    </div>
  );
};

const KeyFactorDirectionImpactContainer: FC<Props> = ({ impact }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("impact")}
      </div>
      <KeyFactorDirectionImpact impact={impact} />
    </div>
  );
};

export default KeyFactorDirectionImpactContainer;
