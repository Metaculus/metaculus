"use client";

import {
  faArrowRightArrowLeft,
  faChartBar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction } from "react";

import Button from "@/components/ui/button";
import ButtonGroup from "@/components/ui/button_group";
import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";

import KeyFactorsNewItemContainer from "../key_factors_new_item_container";

type Props = {
  strength: QuestionLinkStrength;
  direction: QuestionLinkDirection;
  setDirection: Dispatch<SetStateAction<QuestionLinkDirection>>;
  setStrength: Dispatch<SetStateAction<QuestionLinkStrength>>;
  sourceTitle: string;
  targetTitle: string;
  handleSwap: () => void;
  withContainer?: boolean;
};

const CopyQuestionLinkForm: React.FC<Props> = ({
  direction,
  setDirection,
  strength,
  setStrength,
  sourceTitle,
  targetTitle,
  handleSwap,
  withContainer = true,
}) => {
  const t = useTranslations();

  const content = (
    <>
      <KeyFactorsNewItemContainer
        label={t("question")}
        icon={faChartBar}
        containerClassName="p-4"
        labelClassName="font-medium"
      >
        <p className="m-0 -mt-1 text-sm font-medium text-blue-800 dark:text-blue-800-dark">
          {sourceTitle}
        </p>
      </KeyFactorsNewItemContainer>

      <div className="flex flex-wrap items-center justify-between text-base text-gray-900 dark:text-gray-900-dark">
        <div className="flex items-center gap-[10px]">
          <span>{t("copyQuestionLinkImpactPrefix")}</span>

          <ButtonGroup<QuestionLinkDirection>
            value={direction}
            buttons={[
              { value: "positive", label: t("positive") },
              { value: "negative", label: t("negative") },
            ]}
            onChange={setDirection}
            variant="tertiary"
            activeVariant="primary"
          />

          <span>{t("copyQuestionLinkImpactSuffix")}</span>
        </div>

        <Button type="button" variant="tertiary" onClick={handleSwap}>
          <FontAwesomeIcon icon={faArrowRightArrowLeft} />
          <span className="ml-1.5">{t("swap")}</span>
        </Button>
      </div>

      <KeyFactorsNewItemContainer
        label={t("question")}
        icon={faChartBar}
        containerClassName="p-4"
        labelClassName="font-medium"
      >
        <p className="m-0 -mt-1 text-sm font-medium text-blue-800 dark:text-blue-800-dark">
          {targetTitle}
        </p>
      </KeyFactorsNewItemContainer>

      <div className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-900-dark">
        <span>{t("copyQuestionLinkStrengthLabel")}</span>
        <ButtonGroup<QuestionLinkStrength>
          value={strength}
          buttons={[
            { value: "low", label: t("low") },
            { value: "medium", label: t("medium") },
            { value: "high", label: t("high") },
          ]}
          onChange={setStrength}
          variant="tertiary"
          activeVariant="primary"
          className="capitalize"
          activeClassName="capitalize"
        />
      </div>
    </>
  );

  if (!withContainer) {
    return <>{content}</>;
  }

  return (
    <KeyFactorsNewItemContainer
      withHeader={false}
      color="purple"
      containerClassName="gap-6"
    >
      {content}
    </KeyFactorsNewItemContainer>
  );
};

export default CopyQuestionLinkForm;
