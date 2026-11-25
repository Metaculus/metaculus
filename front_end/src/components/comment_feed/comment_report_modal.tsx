"use client";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useId, useState } from "react";
import toast from "react-hot-toast";

import { reportComment } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import RadioButtonGroup, {
  RadioOption,
} from "@/components/ui/radio_button_group";
import { CommentReportReason } from "@/services/api/comments/comments.shared";
import { CommentType } from "@/types/comment";
import { logError } from "@/utils/core/errors";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  comment: CommentType;
};

const CommentReportModal: FC<Props> = ({ isOpen, onClose, comment }) => {
  const t = useTranslations();
  const descriptionId = useId();
  const [reason, setReason] = useState<CommentReportReason | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const options: RadioOption<CommentReportReason>[] = [
    {
      value: "spam",
      label: t("commentsReportReasonSpam"),
      description: t("commentsReportReasonSpamDescription"),
    },
    {
      value: "violation",
      label: t("commentsReportReasonViolation"),
      description: t("commentsReportReasonViolationDescription"),
    },
    {
      value: "ai_generated",
      label: t("commentsReportReasonAiGenerated"),
      description: t("commentsReportReasonAiGeneratedDescription"),
    },
  ];

  const close = () => {
    setReason(null);
    setHasError(false);
    onClose(false);
  };

  const handleClose = () => {
    if (!isLoading) close();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!reason || isLoading) return;

    setIsLoading(true);
    setHasError(false);
    try {
      await reportComment(comment.id, reason);
      toast(t("commentsReportSubmittedMessage"));
      close();
    } catch (err) {
      logError(err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      label={t("commentsReportCommentHeading")}
      isOpen={isOpen}
      onClose={handleClose}
      className="w-full max-w-xl"
    >
      <form onSubmit={handleSubmit}>
        <p
          id={descriptionId}
          className="m-0 text-base text-gray-700 dark:text-gray-700-dark"
        >
          {t("commentsReportCommentDescription")}
        </p>
        <div role="radiogroup" aria-labelledby={descriptionId} className="mt-5">
          <RadioButtonGroup
            name="comment_report_reason"
            value={reason ?? ""}
            options={options}
            onChange={(value) => !isLoading && setReason(value)}
            className="md:flex-col"
          />
        </div>
        {hasError && (
          <p
            role="alert"
            className="mb-0 mt-4 text-sm text-red-500 dark:text-red-500-dark"
          >
            {t("commentsReportError")}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="tertiary"
            disabled={isLoading}
            onClick={handleClose}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!reason || isLoading}
          >
            {t("commentsReportSubmit")}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default CommentReportModal;
