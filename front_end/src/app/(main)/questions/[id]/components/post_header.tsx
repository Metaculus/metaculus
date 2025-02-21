"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { useContentTranslatedBannerProvider } from "@/app/providers";
import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions/";
import PostSubscribeButton from "@/components/post_subscribe/subscribe_button";
import Button from "@/components/ui/button";
import { usePublicSettings } from "@/contexts/public_settings_context";
import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/cn";

import PostApprovalModal from "./post_approval_modal";
import { draftPost, submitPostForReview } from "../../actions";

export default function PostHeader({
  post,
  questionTitle,
}: {
  post: PostWithForecasts;
  questionTitle: string;
}) {
  const t = useTranslations();

  let typeLabel = t("notebook");
  if (post.group_of_questions) {
    typeLabel = t("group");
  } else if (post.conditional) {
    typeLabel = t("conditional");
  } else if (post.question) {
    typeLabel = t("question");
  }

  const allowModifications =
    post.user_permission === ProjectPermissions.ADMIN ||
    post.user_permission === ProjectPermissions.CURATOR ||
    (post.user_permission === ProjectPermissions.CREATOR &&
      post.curation_status !== PostStatus.APPROVED);

  const edit_type = getEditType(post);

  const { setBannerIsVisible } = useContentTranslatedBannerProvider();
  const locale = useLocale();

  useEffect(() => {
    if (post.is_current_content_translated) {
      setTimeout(() => {
        setBannerIsVisible(true);
      }, 0);
    }
  }, [post, locale]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-3">
        <span className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
          {typeLabel}
        </span>
        {allowModifications && (
          <>
            <Link
              className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 no-underline dark:bg-blue-400-dark dark:text-blue-700-dark"
              href={`/questions/create/${edit_type}?post_id=${post.id}`}
            >
              {t("edit")}
            </Link>
          </>
        )}
        {!post.notebook && (
          <div className="ml-auto flex flex-row justify-self-end text-gray-700 dark:text-gray-700-dark lg:hidden">
            {post.curation_status == PostStatus.APPROVED && (
              <PostSubscribeButton post={post} mini />
            )}
            <SharePostMenu questionTitle={questionTitle} questionId={post.id} />
            <PostDropdownMenu post={post} />
          </div>
        )}
      </div>
      <PostStatusBox post={post} className="mt-4" />
    </div>
  );
}

export const PostStatusBox: FC<{
  post: PostWithForecasts;
  className?: string;
}> = ({ post, className }) => {
  const t = useTranslations();
  const router = useRouter();

  const [approvalModalOpen, setIsApprovalModalOpen] = useState(false);
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  if (![PostStatus.PENDING, PostStatus.DRAFT].includes(post.curation_status)) {
    return null;
  }

  const isCommunity =
    post.projects.default_project.type === TournamentType.Community;

  const edit_type = getEditType(post);

  const canEdit = [
    ProjectPermissions.CURATOR,
    ProjectPermissions.ADMIN,
    ProjectPermissions.CREATOR,
  ].includes(post.user_permission);
  const canSendBackToDrafts =
    post.curation_status === PostStatus.PENDING && canEdit;
  const canSubmitForReview =
    post.curation_status === PostStatus.DRAFT && canEdit;
  const canApprove = [
    ProjectPermissions.CURATOR,
    ProjectPermissions.ADMIN,
  ].includes(post.user_permission);

  return (
    <>
      <div
        className={cn(
          "border border-gray-300 bg-gray-200 p-3 dark:border-gray-300-dark dark:bg-gray-200-dark",
          className
        )}
      >
        {post.curation_status === PostStatus.PENDING &&
          (isCommunity ? (
            <>
              <h4 className="mb-2 mt-0">{t("inReview")}</h4>
              <p className="mb-3 mt-0 leading-6">
                {t("inCommunityReviewStatus1")}
              </p>
              <ul className="mb-3 ml-6 mt-0 list-disc leading-6">
                {t.rich("inCommunityReviewStatus2", {
                  li: (chunks) => <li>{chunks}</li>,
                })}
              </ul>
              <Link
                href={"/question-writing"}
                className="mb-3 flex text-base font-normal leading-6 text-blue-700 dark:text-blue-700-dark"
              >
                {t("learnMoreAboutQuestionWriting")}
              </Link>
            </>
          ) : (
            <>
              <h4 className="mb-2 mt-0">{t("inReview")}</h4>
              {!PUBLIC_MINIMAL_UI ? (
                <>
                  <p className="mb-3 mt-0 leading-5">
                    {t.rich("inReviewStatusBox1", {
                      link1: (chunks) => (
                        <Link href="/question-writing/">{chunks}</Link>
                      ),
                      link2: (chunks) => (
                        <Link href="/question-writing/#what-types">
                          {chunks}
                        </Link>
                      ),
                    })}
                  </p>
                  <p className="mb-3 mt-0 leading-5">
                    {t("inReviewStatusBox2")}
                  </p>
                  {post.conditional && (
                    <p className="mb-3 mt-0 leading-5">
                      {t("inReviewStatusBox4")}
                    </p>
                  )}{" "}
                </>
              ) : (
                <p className="mb-3 mt-0 leading-5">{t("inReviewStatusBox5")}</p>
              )}
            </>
          ))}
        {canSubmitForReview && (
          <>
            <h4 className="mb-2 mt-0">{t("draftStatusBox1")}</h4>
            {!PUBLIC_MINIMAL_UI ? (
              <p className="mb-3 mt-0 leading-5">{t("draftStatusBox2")}</p>
            ) : (
              <p className="mb-3 mt-0 leading-5">{t("draftStatusBox3")}</p>
            )}
          </>
        )}
        <div className="flex gap-2">
          {canEdit && (
            <Button href={`/questions/create/${edit_type}?post_id=${post.id}`}>
              {t("edit")}
            </Button>
          )}
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
          {canSendBackToDrafts && (
            <Button
              onClick={async () => {
                await draftPost(post.id, post.projects.default_project);
              }}
            >
              {t("sendBackToDrafts")}
            </Button>
          )}
          {canApprove && (
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
      <PostApprovalModal
        isOpen={approvalModalOpen}
        post={post}
        setIsOpen={setIsApprovalModalOpen}
      />
    </>
  );
};

const getEditType = (post: PostWithForecasts) => {
  let edit_type = "question";
  if (post.group_of_questions) {
    edit_type = "group";
  } else if (post.conditional) {
    edit_type = "conditional";
  } else if (post.notebook) {
    edit_type = "notebook";
  }

  return edit_type;
};
