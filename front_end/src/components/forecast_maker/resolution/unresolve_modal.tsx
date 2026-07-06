"use client";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { unresolveQuestion as unresolveQuestionAction } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useServerAction } from "@/hooks/use_server_action";
import { Question } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
};

const QuestionUnresolveModal: FC<Props> = ({ isOpen, onClose, question }) => {
  const t = useTranslations();
  const [unresolveQuestion, isPending] = useServerAction(
    unresolveQuestionAction,
    onClose
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-xl"
      closeButtonClassName="hidden"
    >
      <div className="flex flex-col gap-6">
        <div className="flex w-full items-center justify-between">
          <h2 className="m-0 text-2xl text-blue-900 dark:text-blue-900-dark">
            {t("confirmUnresolveQuestion")}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "text-2xl text-blue-800 no-underline opacity-50 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
            )}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="tertiary" className="capitalize" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            className="capitalize"
            disabled={isPending}
            onClick={() => unresolveQuestion(question.id)}
          >
            {t("unresolve")} {isPending && <LoadingSpinner size="1x" />}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default QuestionUnresolveModal;
