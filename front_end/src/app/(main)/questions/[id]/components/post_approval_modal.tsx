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

  const approvalMap: Record<string, number> = {};
  if (post.question) {
    approvalMap[post.question.title] = post.question.id;
  } else if (post.group_of_questions) {
    post.group_of_questions.questions.forEach((q) => {
      approvalMap[q.title] = q.id;
    });
  }

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
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        {approvalMap && (
          <>
            {approvalData.map(
              ({ question_title, question_id, open_time, cp_reveal_time }) => {
                return (
                  <div
                    key={`question-${question_id}`}
                    className="flex flex-col gap-2"
                  >
                    <div>
                      <span>{t("Question")}: </span>
                      <span>{question_title}</span>
                    </div>
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
                  </div>
                );
              }
            )}
          </>
        )}
        <Button onClick={handleSubmit} disabled={isLoading}>
          {t("approve")}
        </Button>
        <FormError errors={submitErrors} />
      </div>
    </BaseModal>
  );
};

export default PostApprovalModal;
