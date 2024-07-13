"use client";

import { addDays, format } from "date-fns";
import { e } from "mathjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";
import { z } from "zod";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { QuestionType } from "@/types/question";

import { draftPost, submitPostForReview, updatePost } from "../../actions";

type ApprovalData = Record<
  number,
  { open_time: string | null; cp_reveal_time: string | null }
>;

const PostApprovalModal: FC<{
  post: Post;
  isOpen: boolean;
  setIsOpen: any;
}> = ({ post, isOpen, setIsOpen }) => {
  const router = useRouter();
  const t = useTranslations();
  const [approvalError, setApprovalError] = useState<ErrorResponse | null>(
    null
  );
  const currentDateTime = useMemo(
    () =>
      format(
        new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000),
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
      ),
    []
  );

  const approvalMap: Record<string, number> = {};
  if (post.question) {
    approvalMap[post.question.title] = post.question.id;
  } else if (post.group_of_questions) {
    post.group_of_questions.questions.forEach((q) => {
      approvalMap[q.title] = q.id;
    });
  }

  const initApprovalData: ApprovalData = {};
  for (let question_id of Object.values(approvalMap)) {
    initApprovalData[question_id] = {
      open_time: format(
        addDays(
          new Date(
            new Date().getTime() + new Date().getTimezoneOffset() * 60000
          ),
          1
        ),
        "yyyy-MM-dd'T'HH:mm"
      ),
      cp_reveal_time: format(
        addDays(
          new Date(
            new Date().getTime() + new Date().getTimezoneOffset() * 60000
          ),
          5
        ),
        "yyyy-MM-dd'T'HH:mm"
      ),
    };
  }

  const [approvalData, setApprovalData] =
    useState<ApprovalData>(initApprovalData);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
      }}
    >
      <div className="max-w-xl flex-col items-center text-center">
        <form className="flex flex-col items-center gap-4">
          {approvalMap && (
            <>
              {Object.entries(approvalMap).map(([key, value], index) => {
                return (
                  <div key={index} className="flex flex-col gap-2">
                    <div>
                      <span>{t("Question")}: </span>
                      <span>{key}</span>
                    </div>
                    <span>{t("Open Time")}</span>
                    <Input
                      type="datetime-local"
                      placeholder="date when forecasts will open"
                      className="bg-transparent pl-1"
                      min={currentDateTime}
                      onChange={(e) => {
                        approvalData[value].open_time = e.target.value;
                        setApprovalData(approvalData);
                      }}
                      defaultValue={approvalData[value].open_time as string}
                    />
                    <span>{t("CP Reveal Time")}</span>
                    <Input
                      type="datetime-local"
                      placeholder="time when the cp will be revealed"
                      className="bg-transparent pl-1"
                      min={currentDateTime}
                      onChange={(e) => {
                        approvalData[value].cp_reveal_time = e.target.value;
                        setApprovalData(approvalData);
                      }}
                      defaultValue={
                        approvalData[value].cp_reveal_time as string
                      }
                    />
                  </div>
                );
              })}
            </>
          )}
          <Button
            onClick={async () => {
              for (let question_id in approvalData) {
                if (approvalData[question_id].open_time === null) {
                  setApprovalError({
                    message: "Please enter an open time for all questions",
                  });
                  return;
                }
                if (approvalData[question_id].cp_reveal_time === null) {
                  setApprovalError({
                    message: "Please enter a CP reveal time for all questions",
                  });
                  return;
                }
              }
              if (post.question) {
                await updatePost(post.id, {
                  published_at: currentDateTime,
                  curation_status: PostStatus.APPROVED,

                  question: {
                    id: post.question.id,
                    open_time: approvalData[post.question.id].open_time,
                    cp_reveal_time:
                      approvalData[post.question.id].cp_reveal_time,
                  },
                });
              } else if (post.group_of_questions) {
                const approvalDatesArr = [];
                for (let question_id in approvalData) {
                  approvalDatesArr.push({
                    id: question_id,
                    open_time: approvalData[question_id].open_time,
                    cp_reveal_time: approvalData[question_id].cp_reveal_time,
                  });
                }
                await updatePost(post.id, {
                  curation_status: PostStatus.APPROVED,
                  published_at: currentDateTime,
                  group_of_questions: {
                    questions: approvalDatesArr,
                  },
                });
              } else {
                await updatePost(post.id, {
                  published_at: currentDateTime,
                  curation_status: PostStatus.APPROVED,
                });
              }

              setIsOpen(false);
              router.refresh();
            }}
          >
            {t("approveButton")}
          </Button>
          {approvalError && (
            <div className="rounded-md bg-red-500 p-4 text-white">
              {approvalError.message}
            </div>
          )}
        </form>
      </div>
    </BaseModal>
  );
};

export default function Modbox({ post }: { post: PostWithForecasts }) {
  const router = useRouter();
  const t = useTranslations();

  let edit_type = "question";
  if (post.group_of_questions) {
    edit_type = "group";
  } else if (post.conditional) {
    edit_type = "conditional";
  } else if (post.notebook) {
    edit_type = "notebook";
  }

  const [approvalModalOpen, setIsApprovalModalOpen] = useState(false);

  return (
    <div className="flex flex-row flex-wrap items-center gap-4">
      <PostApprovalModal
        isOpen={approvalModalOpen}
        post={post}
        setIsOpen={setIsApprovalModalOpen}
      />
      {post.status == PostStatus.PENDING && (
        <button
          className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
          onClick={async () => {
            await draftPost(post.id);
            router.refresh();
          }}
        >
          {t("sendBackDraftButton")}
        </button>
      )}
      {post.status == PostStatus.DRAFT && (
        <button
          className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
          onClick={async () => {
            await submitPostForReview(post.id);
            router.refresh();
          }}
        >
          {t("submitForReviewButton")}
        </button>
      )}
      {post.status == PostStatus.PENDING &&
        [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
          post.user_permission
        ) && (
          <button
            className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
            onClick={async () => {
              setIsApprovalModalOpen(true);
            }}
          >
            {t("approveButton")}
          </button>
        )}
      {post.status == PostStatus.APPROVED &&
        [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
          post.user_permission
        ) &&
        post?.forecasts_count &&
        post.forecasts_count < 1 && (
          <button
            className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark"
            onClick={async () => {
              setIsApprovalModalOpen(true);
            }}
          >
            {t("Edit Open & CP Reveal Times")}
          </button>
        )}
      <button className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
        <a
          href={`/questions/create/${edit_type}?post_id=${post.id}`}
          className="no-underline"
        >
          {t("edit")}
        </a>
      </button>
    </div>
  );
}
