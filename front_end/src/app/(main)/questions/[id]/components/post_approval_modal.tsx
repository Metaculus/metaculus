"use client";

import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

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
  setIsOpen: any;
}> = ({ post, isOpen, setIsOpen }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>();

  const currentDateTime = useMemo(
    () => formatInTimeZone(new Date(), "UTC", "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    []
  );

  const questions = useMemo(() => {
    if (post.question) return [post.question];
    if (post.group_of_questions) return post.group_of_questions.questions;

    return [];
  }, [post.group_of_questions, post.question]);

  const [approvalData, setApprovalData] = useState<
    (ApprovePostParams & { question_title: string })[]
  >(() =>
    questions.map(({ id: question_id, title: question_title }) => ({
      question_id,
      question_title,
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
    }))
  );

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
            : t("postQuestionApprovalSubtitle")}
        </p>
        <div className="mb-4 flex flex-col gap-4">
          {approvalData.map(
            (
              { question_title, question_id, open_time, cp_reveal_time },
              idx
            ) => (
              <div
                key={`question-${question_id}`}
                className="flex flex-col gap-2"
              >
                <h4 className="m-0">{question_title}</h4>
                <span>{t("openTime")}</span>
                <DatetimeUtc
                  placeholder="date when forecasts will open"
                  min={currentDateTime}
                  onChange={(dt) =>
                    setApprovalData(
                      approvalData.map((obj) => ({
                        ...obj,
                        ...(obj.question_id === question_id
                          ? { open_time: dt }
                          : {}),
                      }))
                    )
                  }
                  defaultValue={open_time}
                />
                <span>{t("cpRevealTime")}</span>
                <DatetimeUtc
                  placeholder="time when the cp will be revealed"
                  min={currentDateTime}
                  onChange={(dt) =>
                    setApprovalData(
                      approvalData.map((obj) => ({
                        ...obj,
                        ...(obj.question_id === question_id
                          ? { cp_reveal_time: dt }
                          : {}),
                      }))
                    )
                  }
                  defaultValue={cp_reveal_time}
                />
                {idx < approvalData.length - 1 && (
                  <hr className="mb-4 mt-8 border-gray-400 dark:border-gray-400-dark" />
                )}
              </div>
            )
          )}
        </div>
        <div className="flex w-full justify-end gap-2">
          <Button
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            variant="secondary"
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} variant="primary">
            {t("approve")}
          </Button>
        </div>
        <FormError errors={submitErrors} />
      </div>
    </BaseModal>
  );
};

export default PostApprovalModal;
