"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import { ProjectPermissions } from "@/types/post";
import { Question } from "@/types/question";
import { canResolveQuestion } from "@/utils/questions";

import QuestionResolutionModal from "./resolution_modal";

type Props = {
  question: Question;
  permission?: ProjectPermissions;
  className?: string;
};

const QuestionResolutionButton: FC<Props> = ({
  question,
  permission,
  className,
}) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  if (canResolveQuestion(question, permission)) {
    return (
      <>
        <Button
          variant="secondary"
          onClick={() => setIsOpen(true)}
          className={className}
        >
          {t("resolveButton")}
        </Button>
        <QuestionResolutionModal
          question={question}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
  }
};

export default QuestionResolutionButton;
