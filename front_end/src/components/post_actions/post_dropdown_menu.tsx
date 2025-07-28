"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";
import toast from "react-hot-toast";

import DataRequestModal from "@/app/(main)/questions/[id]/components/download_question_data_modal";
import PostDestructiveActionModal, {
  PostDestructiveActionModalProps,
} from "@/app/(main)/questions/[id]/components/post_destructive_action_modal";
import { changePostActivityBoost } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { useShareMenuItems } from "@/hooks/use_share_menu_items";
import { BoostDirection } from "@/services/api/posts/posts.shared";
import {
  Post,
  PostStatus,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import { getPostEditLink } from "@/utils/navigation";

type Props = {
  post: Post;
  button?: React.ReactNode;
};

export const PostDropdownMenu: FC<Props> = ({ post, button }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();

  const isUpcoming = post.question?.status === QuestionStatus.UPCOMING;
  const isAdmin = [ProjectPermissions.ADMIN].includes(post.user_permission);
  const isCurator = [ProjectPermissions.CURATOR].includes(post.user_permission);
  const allowEdit =
    isAdmin ||
    ([ProjectPermissions.CURATOR, ProjectPermissions.CREATOR].includes(
      post.user_permission
    ) &&
      post.curation_status !== PostStatus.APPROVED);
  const isLargeScreen = useBreakpoint("md");

  const shareMenuItems = useShareMenuItems({
    questionTitle: post.title,
    questionId: post.question?.id,
    includeEmbedOnSmallScreens: false, // Don't include embed on small screens in dropdown
  });

  const [confirmModalOpen, setConfirmModalOpen] = useState<{
    open: boolean;
    type: PostDestructiveActionModalProps["destructiveAction"];
  }>({
    open: false,
    type: "reject",
  });

  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const openDownloadModal = () => {
    setIsDownloadModalOpen(true);
  };
  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const changePostActivity = useCallback(
    (direction: BoostDirection) => {
      changePostActivityBoost(post.id, direction).then(
        ({ score, score_total }) => {
          if (score > 0) {
            toast(t("contentBoosted", { score, score_total }));
          } else {
            toast(t("contentBuried", { score, score_total }));
          }
        }
      );
    },
    [post.id, t]
  );

  const createDuplicateLink = (post: Post) => {
    if (post.question) {
      return `/questions/create/question?mode=create&post_id=${post.id}`;
    }

    if (post.conditional) {
      return `/questions/create/conditional?mode=create&post_id=${post.id}`;
    }

    if (post.group_of_questions) {
      return `/questions/create/group?mode=create&post_id=${post.id}`;
    }

    if (post.notebook) {
      return `/questions/create/notebook?mode=create&post_id=${post.id}`;
    }

    console.warn("Could not create duplicate link for post: unsupported type");
    return "#";
  };

  const menuItems: MenuItemProps[] = [
    // Mobile menu items
    // TODO: check for Notebooks
    ...(!isLargeScreen
      ? [
          {
            id: "share",
            name: t("share"),
            className: "capitalize",
            items: shareMenuItems,
          },
        ]
      : []),

    // Include if user has permissions to edit
    ...(allowEdit
      ? [
          {
            id: "edit",
            name: t("edit"),
            link: getPostEditLink(post),
          },
        ]
      : []),

    // Include if user is a superuser
    ...(user?.is_superuser
      ? [
          {
            id: "boost",
            name: t("boost"),
            onClick: () => changePostActivity(1),
          },
          {
            id: "bury",
            name: t("bury"),
            onClick: () => changePostActivity(-1),
          },
          {
            id: "duplicate",
            name: t("duplicate"),
            link: createDuplicateLink(post),
          },
          {
            id: "viewInDjangoAdmin",
            name: t("viewInDjangoAdmin"),
            link: `/admin/posts/post/${post.id}/change`,
          },
        ]
      : []),

    // Include if upcoming and user is admin or curator
    ...(isUpcoming && (isAdmin || isCurator)
      ? [
          {
            id: "sendBackToReview",
            name: t("sendBackToReview"),
            onClick: () => {
              setConfirmModalOpen({
                open: true,
                type: "sendBackToReview",
              });
            },
          },
        ]
      : []),

    // Include if post does not have a notebook
    ...(!post.notebook
      ? [
          {
            id: "downloadQuestionData",
            name: t("downloadQuestionData"),
            onClick: openDownloadModal,
          },
        ]
      : []),

    // Include if user is admin
    ...(isAdmin
      ? [
          {
            id: "deleteQuestion",
            name: t("delete"),
            onClick: () => {
              setConfirmModalOpen({
                open: true,
                type: "delete",
              });
            },
          },
        ]
      : []),
  ];

  if (!menuItems.length) {
    return null;
  }

  return (
    <>
      <PostDestructiveActionModal
        isOpen={confirmModalOpen.open}
        post={post}
        destructiveAction={confirmModalOpen.type}
        onClose={() =>
          setConfirmModalOpen({ ...confirmModalOpen, open: false })
        }
        onActionComplete={() => {
          router.refresh();
        }}
      />
      <DataRequestModal
        isOpen={isDownloadModalOpen}
        onClose={closeDownloadModal}
        post={post}
      />
      <DropdownMenu items={menuItems}>
        {button ? (
          button
        ) : (
          <Button
            variant="secondary"
            className="rounded border-0"
            presentationType="icon"
          >
            <FontAwesomeIcon icon={faEllipsis} className="text-lg" />
          </Button>
        )}
      </DropdownMenu>
    </>
  );
};
