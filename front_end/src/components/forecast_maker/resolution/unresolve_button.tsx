"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { unresolveQuestion as unresolveQuestionAction } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ProjectPermissions } from "@/types/post";
import { Question } from "@/types/question";
import cn from "@/utils/core/cn";
import { canChangeQuestionResolution } from "@/utils/questions/resolution";

type Props = {
  question: Question;
  permission?: ProjectPermissions;
  className?: string;
};

const QuestionUnresolveButton: FC<Props> = ({
  question,
  permission,
  className,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const [unresolveQuestion, isPending] = useServerAction(
    unresolveQuestionAction
  );

  if (!canChangeQuestionResolution(question, permission, false)) {
    return null;
  }

  return (
    <Button
      variant="secondary"
      onClick={() =>
        setCurrentModal({
          type: "confirm",
          data: {
            title: t("confirmUnresolveQuestion"),
            onConfirm: () => unresolveQuestion(question.id),
          },
        })
      }
      className={cn("w-[95px]", className)}
    >
      {isPending ? <LoadingSpinner size="1x" /> : t("unresolve")}
    </Button>
  );
};

export default QuestionUnresolveButton;
