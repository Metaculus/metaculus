"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { FC } from "react";

import cn from "@/utils/core/cn";

const CreateQuestionButton: FC = () => {
  const t = useTranslations();

  const variant =
    useFeatureFlagVariantKey("create_question_button_type") || "experiment_B";

  let text: string;
  let hasEmphasis: boolean;

  switch (variant) {
    case "experiment_A":
      text = t("create");
      hasEmphasis = false;
      break;
    case "experiment_B":
      text = t("create");
      hasEmphasis = true;
      break;
    case "experiment_C":
      text = t("submitAQuestion");
      hasEmphasis = false;
      break;
    case "experiment_D":
      text = t("submitAQuestion");
      hasEmphasis = true;
      break;
    default:
      text = t("create");
      hasEmphasis = false;
      break;
  }

  return (
    <div
      className={cn(
        "flex h-full items-center capitalize",
        hasEmphasis && "rounded-full bg-blue-700 px-2 py-1"
      )}
    >
      <FontAwesomeIcon size="xs" className="mr-1" icon={faPlus} />
      {text}
    </div>
  );
};

export default CreateQuestionButton;
