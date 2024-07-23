"use client";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useState } from "react";

import DropdownMenu from "@/components/ui/dropdown_menu";
import { ProjectPermissions } from "@/types/post";
import { Question } from "@/types/question";
import { canResolveQuestion } from "@/utils/questions";

import QuestionResolutionModal from "../resolution/resolution_modal";

type Props = {
  question: Question;
  permission?: ProjectPermissions;
  button?: ReactNode;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

const ForecastMakerGroupControls: FC<Props> = ({
  question,
  button,
  permission,
}) => {
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const t = useTranslations();

  return (
    <div className="flex gap-1">
      <DropdownMenu
        items={[
          ...(canResolveQuestion(question, permission)
            ? [
                {
                  id: "resolve",
                  name: t("resolveButton"),
                  onClick: () => setIsResolutionModalOpen(true),
                },
              ]
            : []),
          {
            id: "copyLink",
            name: t("copyLink"),
            onClick: () => {
              copyToClipboard(
                `${window.location.origin}${window.location.pathname}?sub-question=${question.id}`
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
    </div>
  );
};

export default ForecastMakerGroupControls;
