"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";
import toast from "react-hot-toast";

import { reportComment } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { CommentReportReason } from "@/services/api/comments/comments.shared";
import { CommentType } from "@/types/comment";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  comment: CommentType;
};

const CommentReportModal: FC<Props> = ({ isOpen, onClose, comment }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleReport = async (reason: CommentReportReason) => {
    setIsLoading(true);
    try {
      await reportComment(comment.id, reason);
      toast(t("commentsReportSubmittedMessage"));
    } finally {
      setIsLoading(false);
    }

    onClose(true);
  };

  return (
    <BaseModal
      label={t("commentsReportCommentHeading")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-w-xl">
        <p className="text-base leading-tight">
          {t("commentsReportCommentDescription")}
        </p>
        <div className="mt-8 flex w-full flex-col gap-4">
          <Button
            variant="secondary"
            disabled={isLoading}
            onClick={() => handleReport("spam")}
          >
            {t("commentsReportSpam")}
          </Button>
          <Button
            variant="secondary"
            disabled={isLoading}
            onClick={() => handleReport("violation")}
          >
            {t("commentsReportGuidelinesViolation")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default CommentReportModal;
