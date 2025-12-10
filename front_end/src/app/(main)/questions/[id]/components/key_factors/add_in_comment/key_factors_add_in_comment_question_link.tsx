"use client";

import { faLink } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { createCoherenceLink } from "@/app/(main)/questions/actions";
import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";
import { StrengthValues } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { Question } from "@/types/question";

import KeyFactorsAddInCommentWrapper from "./key_factors_add_in_comment_wrapper";
import KeyFactorsNewItemContainer from "../item_creation/key_factors_new_item_container";
import CopyQuestionLinkForm from "../item_creation/question_link/copy_question_link_form";

type Props = {
  postData: PostWithForecasts;
  candidates: Question[];
  onCancel: () => void;
  onBack: () => void;
  onDone?: () => void;
};

type LocalLinkConfig = {
  question: Question;
  direction: QuestionLinkDirection;
  strength: QuestionLinkStrength;
  swapped: boolean;
};

const KeyFactorsAddInCommentQuestionLink: React.FC<Props> = ({
  postData,
  candidates,
  onCancel,
  onBack,
  onDone,
}) => {
  const t = useTranslations();
  const { updateCoherenceLinks } = useCoherenceLinksContext();

  const currentQuestion = postData.question;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [config, setConfig] = useState<LocalLinkConfig | null>(() => {
    const first = candidates[0];
    return first
      ? {
          question: first,
          direction: "positive",
          strength: "medium",
          swapped: false,
        }
      : null;
  });

  const canSubmit = !!currentQuestion && !!config;

  const handleSubmit = async () => {
    if (!currentQuestion || !config || !canSubmit) return;

    setIsSubmitting(true);

    try {
      const { question, direction, strength, swapped } = config;

      const dirNumber = direction === "positive" ? 1 : -1;
      const strengthMap: Record<QuestionLinkStrength, StrengthValues> = {
        low: StrengthValues.LOW,
        medium: StrengthValues.MEDIUM,
        high: StrengthValues.HIGH,
      };
      const strengthNumber = strengthMap[strength];
      const type = "causal";

      const [sourceQuestion, targetQuestion] = swapped
        ? [question, currentQuestion]
        : [currentQuestion, question];

      const error = await createCoherenceLink(
        sourceQuestion,
        targetQuestion,
        dirNumber,
        strengthNumber,
        type
      );

      if (error) {
        console.error("createCoherenceLink error", error);
      }

      await updateCoherenceLinks();
      onDone?.();
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config || !currentQuestion) {
    return null;
  }

  return (
    <KeyFactorsAddInCommentWrapper
      submitLabel={t("createQuestionLink")}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      disableSubmit={!canSubmit || isSubmitting}
    >
      <KeyFactorsNewItemContainer
        icon={faLink}
        label={t("questionLink")}
        onBack={onBack}
      >
        <div className="flex flex-col gap-5">
          <p className="my-0 mt-2 text-sm text-gray-800 dark:text-gray-800-dark">
            {t("copyLinkTitle")}
          </p>
          <p className="my-0 text-sm text-gray-800 dark:text-gray-800-dark">
            {t("copyQuestionLinkPrivate")}
          </p>
          <CopyQuestionLinkForm
            direction={config.direction}
            setDirection={(updater) =>
              setConfig((prev) => {
                if (!prev) return prev;
                const nextDirection =
                  typeof updater === "function"
                    ? updater(prev.direction)
                    : updater;
                return { ...prev, direction: nextDirection };
              })
            }
            strength={config.strength}
            setStrength={(updater) =>
              setConfig((prev) => {
                if (!prev) return prev;
                const nextStrength =
                  typeof updater === "function"
                    ? updater(prev.strength)
                    : updater;
                return { ...prev, strength: nextStrength };
              })
            }
            sourceTitle={
              config.swapped ? config.question.title : currentQuestion.title
            }
            targetTitle={
              config.swapped ? currentQuestion.title : config.question.title
            }
            handleSwap={() =>
              setConfig((prev) =>
                prev ? { ...prev, swapped: !prev.swapped } : prev
              )
            }
            withContainer={false}
          />
        </div>
      </KeyFactorsNewItemContainer>
    </KeyFactorsAddInCommentWrapper>
  );
};

export default KeyFactorsAddInCommentQuestionLink;
