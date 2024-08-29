"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { SharePostMenu, PostDropdownMenu } from "@/components/post_actions/";
import Button from "@/components/ui/button";
import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";

import PostApprovalModal from "./post_approval_modal";
import PostSubscribeButton from "./subscribe_button";
import { draftPost, submitPostForReview } from "../../actions";

export default function PostHeader({
  post,
  questionTitle,
}: {
  post: PostWithForecasts;
  questionTitle: string;
}) {
  const t = useTranslations();
  const router = useRouter();

  let typeLabel = t("notebook");
  if (post.group_of_questions) {
    typeLabel = t("group");
  } else if (post.conditional) {
    typeLabel = t("conditionalGroup");
  } else if (post.question) {
    typeLabel = t("question");
  }

  const allowModifications =
    post.user_permission === ProjectPermissions.ADMIN ||
    post.user_permission === ProjectPermissions.CURATOR ||
    (post.user_permission === ProjectPermissions.CREATOR &&
      post.status === PostStatus.APPROVED);

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
    <div className="flex flex-col">
      <div className="flex flex-row gap-3 pt-3 lg:hidden lg:pt-0">
        <span className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
          {typeLabel}
        </span>
        {allowModifications && (
          <>
            <Button
              href={`/questions/create/${edit_type}?post_id=${post.id}`}
              className="h-7"
            >
              {t("edit")}
            </Button>
            {post.status === PostStatus.APPROVED &&
            [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
              post.user_permission
            ) &&
            post.forecasts_count! < 1 ? (
              <Button
                onClick={async () => {
                  setIsApprovalModalOpen(true);
                }}
              >
                {t("editOpenAndCpRevealTimes")}
              </Button>
            ) : null}
          </>
        )}
        <div className="ml-auto flex flex-row justify-self-end text-gray-700 dark:text-gray-700-dark lg:hidden">
          <PostSubscribeButton post={post} mini />
          <SharePostMenu questionTitle={questionTitle} questionId={post.id} />
          <PostDropdownMenu post={post} />
        </div>
      </div>
      {[PostStatus.PENDING, PostStatus.DRAFT].includes(post.status) && (
        <div className="mt-4 border border-gray-300 bg-gray-200 p-3 dark:border-gray-300-dark dark:bg-gray-200-dark">
          {post.status === PostStatus.PENDING && (
            <>
              <h4 className="mb-2 mt-0">{t("inReview")}</h4>
              <p className="mb-3 mt-0 leading-5">
                {t.rich("inReviewStatusBox1", {
                  link1: (chunks) => <a href="/question-writing/">{chunks}</a>,
                  link2: (chunks) => (
                    <a href="/question-writing/#what-types">{chunks}</a>
                  ),
                })}
              </p>
              <p className="mb-3 mt-0 leading-5">{t("inReviewStatusBox2")}</p>
              <p className="mb-3 mt-0 leading-5">{t("inReviewStatusBox3")}</p>
              {post.conditional && (
                <p className="mb-3 mt-0 leading-5">{t("inReviewStatusBox4")}</p>
              )}
            </>
          )}
          {post.status === PostStatus.DRAFT && (
            <>
              <h4 className="mb-2 mt-0">{t("draftStatusBox1")}</h4>
              <p className="mb-3 mt-0 leading-5">{t("draftStatusBox2")}</p>
            </>
          )}
          <div className="flex gap-2">
            <Button href={`/questions/create/${edit_type}?post_id=${post.id}`}>
              {t("edit")}
            </Button>
            <Button>Invite Co-authors (TODO)</Button>
            {post.status === PostStatus.DRAFT && (
              <Button
                onClick={async () => {
                  await submitPostForReview(post.id);
                  router.refresh();
                }}
              >
                {t("submitForReview")}
              </Button>
            )}
            {post.status === PostStatus.PENDING && (
              <Button
                onClick={async () => {
                  await draftPost(post.id);
                  router.refresh();
                }}
              >
                {t("sendBackToDrafts")}
              </Button>
            )}
            {[ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
              post.user_permission
            ) && (
              <Button
                onClick={async () => {
                  setIsApprovalModalOpen(true);
                }}
                className="capitalize"
              >
                {t("approve")}
              </Button>
            )}
          </div>
        </div>
      )}
      <PostApprovalModal
        isOpen={approvalModalOpen}
        post={post}
        setIsOpen={setIsApprovalModalOpen}
      />
    </div>
  );
}
