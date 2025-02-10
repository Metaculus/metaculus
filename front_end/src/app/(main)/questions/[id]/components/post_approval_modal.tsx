"use client";

import { addDays, isBefore } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { FormError } from "@/components/ui/form_field";
import { ApprovePostParams } from "@/services/posts";
import { ErrorResponse } from "@/types/fetch";
import { Post } from "@/types/post";

import { approvePost } from "../../actions";

const PostApprovalModal: FC<{
  post: Post;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}> = ({ post, isOpen, setIsOpen }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>();

  const currentDateTime = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    []
  );

  const [approvalData, setApprovalData] = useState<ApprovePostParams>(() => ({
    open_time: formatInTimeZone(
      addDays(new Date(), 1),
      "UTC",
      "yyyy-MM-dd'T'HH:mm:ss'Z'"
    ),
    cp_reveal_time: formatInTimeZone(
      addDays(new Date(), 5),
      "UTC",
      "yyyy-MM-dd'T'HH:mm:ss'Z'"
    ),
  }));

  useEffect(() => {
    setSubmitErrors(undefined);
    if (!isBefore(approvalData.open_time, post.scheduled_close_time)) {
      setSubmitErrors(new Error(t("closeDateError")));
    }
  }, [approvalData.open_time, post.scheduled_close_time, t]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      // use form data to send request to the email api
      const response = await approvePost(post.id, approvalData);

      if (response && "errors" in response && !!response.errors) {
        setSubmitErrors(response.errors);
      } else {
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [approvalData, post.id, setIsOpen]);

  return (
    <BaseModal
      isOpen={isOpen}
      label={
        post.notebook ? t("postNotebookApproval") : t("postQuestionApproval")
      }
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <div className="flex max-w-sm flex-col gap-4">
        <p className="text-base leading-tight">
          {post.notebook
            ? t("postNotebookApprovalSubtitle")
            : post.group_of_questions
              ? t("postGroupOfQuestionsApprovalSubtitle")
              : t("postQuestionApprovalSubtitle")}
        </p>
        {!post.notebook && (
          <div className="mb-4 flex flex-col gap-2">
            <span>{t("openTime")}</span>
            <DatetimeUtc
              placeholder="date when forecasts will open"
              min={currentDateTime}
              onChange={(dt) =>
                setApprovalData({
                  ...approvalData,
                  open_time: dt,
                })
              }
              defaultValue={approvalData.open_time}
            />
            <span>{t("cpRevealTime")}</span>
            <DatetimeUtc
              placeholder="time when the cp will be revealed"
              min={currentDateTime}
              onChange={(dt) =>
                setApprovalData({
                  ...approvalData,
                  cp_reveal_time: dt,
                })
              }
              defaultValue={approvalData.cp_reveal_time}
            />
          </div>
        )}
        <div className="flex w-full justify-end gap-2">
          <Button
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            variant="secondary"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !isBefore(approvalData.open_time, post.scheduled_close_time)
            }
            variant="primary"
          >
            {t("approve")}
          </Button>
        </div>
        <FormError errors={submitErrors} />
      </div>
    </BaseModal>
  );
};

export default PostApprovalModal;
