"use client";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useState } from "react";

import DropdownMenu from "@/components/ui/dropdown_menu";
import { ProjectPermissions } from "@/types/post";
import { Question } from "@/types/question";
import { canResolveQuestion } from "@/utils/questions";

import { SLUG_POST_SUB_QUESTION_ID } from "../../../search_params";
import QuestionResolutionModal from "../resolution/resolution_modal";

type Props = {
  question: Question;
  permission?: ProjectPermissions;
  button?: ReactNode;
};

const ForecastMakerGroupControls: FC<Props> = ({
  question,
  button,
  permission,
}) => {
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const t = useTranslations();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(t("failedToCopyText"), err);
    }
  };

  return (
    <>
      <DropdownMenu
        items={[
          ...(canResolveQuestion(question, permission)
            ? [
                {
                  id: "resolve",
                  name: t("resolve"),
                  onClick: () => setIsResolutionModalOpen(true),
                },
              ]
            : []),
          {
            id: "copyLink",
            name: t("copyLink"),
            onClick: () => {
              copyToClipboard(
                `${window.location.origin}${window.location.pathname}?${SLUG_POST_SUB_QUESTION_ID}=${question.id}`
              ).then();
            },
          },
        ]}
      >
        {button}
      </DropdownMenu>

      <QuestionResolutionModal
        question={question}
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
      />
    </>
  );
};

export default ForecastMakerGroupControls;
