"use client";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useState } from "react";

import { unresolveQuestion as unresolveQuestionAction } from "@/app/(main)/questions/actions";
import DropdownMenu from "@/components/ui/dropdown_menu";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ProjectPermissions } from "@/types/post";
import { Question } from "@/types/question";
import { logError } from "@/utils/errors";
import { canChangeQuestionResolution } from "@/utils/questions";

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
  const { setCurrentModal } = useModal();
  const [unresolveQuestion, isPending] = useServerAction(
    unresolveQuestionAction
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      logError(err, `${t("failedToCopyText")} ${err}`);
    }
  };

  return (
    <>
      <DropdownMenu
        items={[
          ...(canChangeQuestionResolution(question, permission)
            ? [
                {
                  id: "resolve",
                  name: t("resolve"),
                  onClick: () => setIsResolutionModalOpen(true),
                },
              ]
            : []),
          ...(canChangeQuestionResolution(question, permission, false)
            ? [
                {
                  id: "unresolve",
                  name: t("unresolve"),
                  onClick: () =>
                    setCurrentModal({
                      type: "confirm",
                      data: { onConfirm: () => unresolveQuestion(question.id) },
                    }),
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
        {isPending ? (
          <LoadingSpinner size="lg" className="h-[32px] w-[32px]" />
        ) : (
          button
        )}
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
