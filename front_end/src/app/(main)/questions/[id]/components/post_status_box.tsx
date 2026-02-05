"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import { usePublicSettings } from "@/contexts/public_settings_context";
import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getPostEditLink } from "@/utils/navigation";

import PostApprovalModal from "./post_approval_modal";
import PostDestructiveActionModal from "./post_destructive_action_modal";
import { draftPost, submitPostForReview } from "../../actions";

export const PostStatusBox: FC<{
  post: PostWithForecasts;
  className?: string;
}> = ({ post, className }) => {
  const t = useTranslations();
  const router = useRouter();

  const [approvalModalOpen, setIsApprovalModalOpen] = useState(false);
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  const [confirmModalOpen, setConfirmModalOpen] = useState<{
    type?: "reject" | "delete";
    open: boolean;
  }>({
    open: false,
  });

  if (![PostStatus.PENDING, PostStatus.DRAFT].includes(post.curation_status)) {
    return null;
  }

  const defaultProject = post.projects?.default_project;
  const isCommunity = defaultProject?.type === TournamentType.Community;

  const canEdit = [
    ProjectPermissions.CURATOR,
    ProjectPermissions.ADMIN,
    ProjectPermissions.CREATOR,
  ].includes(post.user_permission);
  const canSendBackToDrafts =
    post.curation_status === PostStatus.PENDING && canEdit && !!defaultProject;
  const canSubmitForReview =
    post.curation_status === PostStatus.DRAFT && canEdit;
  const canApproveOrReject =
    post.curation_status === PostStatus.PENDING &&
    [ProjectPermissions.CURATOR, ProjectPermissions.ADMIN].includes(
      post.user_permission
    );

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
          {canEdit && <Button href={getPostEditLink(post)}>{t("edit")}</Button>}
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

          {canApproveOrReject && (
            <Button
              onClick={() => {
                setConfirmModalOpen({
                  type: "reject",
                  open: true,
                });
              }}
              className="capitalize"
            >
              {t("reject")}
            </Button>
          )}

          {canEdit && (
            <Button
              onClick={() => {
                setConfirmModalOpen({
                  type: "delete",
                  open: true,
                });
              }}
            >
              {t("delete")}
            </Button>
          )}

          {canSendBackToDrafts && defaultProject && (
            <Button
              onClick={async () => {
                await draftPost(post.id, defaultProject);
              }}
            >
              {t("sendBackToDrafts")}
            </Button>
          )}
          {canApproveOrReject && (
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
      <PostDestructiveActionModal
        isOpen={confirmModalOpen.open}
        post={post}
        destructiveAction={confirmModalOpen.type ?? "reject"}
        onClose={() =>
          setConfirmModalOpen({ ...confirmModalOpen, open: false })
        }
        onActionComplete={() => {
          router.refresh();
        }}
      />
      <PostApprovalModal
        isOpen={approvalModalOpen}
        post={post}
        setIsOpen={setIsApprovalModalOpen}
      />
    </>
  );
};
