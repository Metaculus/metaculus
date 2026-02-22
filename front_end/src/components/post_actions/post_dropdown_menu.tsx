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
import QuestionResolutionModal from "@/components/forecast_maker/resolution/resolution_modal";
import QuestionUnresolveModal from "@/components/forecast_maker/resolution/unresolve_modal";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import useEmbedModalContext from "@/contexts/embed_modal_context";
import { usePostSubscriptionContext } from "@/contexts/post_subscription_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { useShareMenuItems } from "@/hooks/use_share_menu_items";
import { BoostDirection } from "@/services/api/posts/posts.shared";
import { Post, PostStatus, ProjectPermissions } from "@/types/post";
import { getPostEditLink } from "@/utils/navigation";
import { isQuestionPost } from "@/utils/questions/helpers";
import { canChangeQuestionResolution } from "@/utils/questions/resolution";

type Props = {
  post: Post;
  button?: React.ReactNode;
};

export const PostDropdownMenu: FC<Props> = ({ post, button }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const { updateIsOpen: openEmbedModal } = useEmbedModalContext();

  const { user_permission } = post;
  const isUpcoming = new Date(post.open_time).getTime() > Date.now();
  const isAdmin = [ProjectPermissions.ADMIN].includes(user_permission);
  const isCurator = [ProjectPermissions.CURATOR].includes(user_permission);
  const isCreator = user_permission === ProjectPermissions.CREATOR;
  const isApproved = post.curation_status === PostStatus.APPROVED;

  const allowEdit =
    // Admins can always edit
    isAdmin ||
    // Curators or creators can edit if not yet approved
    ((isCurator || isCreator) && !isApproved) ||
    // Curators can edit approved posts that are not yet open
    (isCurator && isApproved && isUpcoming);

  const isLargeScreen = useBreakpoint("lg");

  const canResolve =
    isQuestionPost(post) &&
    canChangeQuestionResolution(post.question, user_permission);
  const canUnresolve =
    isQuestionPost(post) &&
    canChangeQuestionResolution(post.question, user_permission, false);

  const shareMenuItems = useShareMenuItems({
    questionTitle: post.title,
    questionId: post.question?.id,
    includeEmbedOnSmallScreens: false, // Don't include embed on small screens in dropdown
  });

  const { isSubscribed, toggleSubscription } = usePostSubscriptionContext();

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

  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [isUnresolveModalOpen, setIsUnresolveModalOpen] = useState(false);

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
    ...(!isLargeScreen
      ? [
          {
            id: "share",
            name: t("share"),
            className: "capitalize",
            items: shareMenuItems,
          },
          {
            id: "subscription",
            name: isSubscribed ? t("followingButton") : t("followButton"),
            onClick: toggleSubscription,
          },
          {
            id: "embed",
            name: t("embed"),
            className: "capitalize",
            onClick: () => openEmbedModal(true),
          },
        ]
      : []),

    // Resolution actions
    ...(canResolve
      ? [
          {
            id: "resolve",
            name: t("resolve"),
            onClick: () => setIsResolutionModalOpen(true),
          },
        ]
      : []),

    ...(canUnresolve
      ? [
          {
            id: "unresolve",
            name: t("unresolve"),
            onClick: () => setIsUnresolveModalOpen(true),
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
            id: "viewInDjangoAdmin",
            name: t("viewInDjangoAdmin"),
            link: `/admin/posts/post/${post.id}/change`,
          },
        ]
      : []),

    // Include if user is Admin Or Curator
    ...(isAdmin || isCurator
      ? [
          {
            id: "duplicate",
            name: t("duplicate"),
            link: createDuplicateLink(post),
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
            id: "openInAggregationExplorer",
            name: t("openInAggregationExplorer"),
            link: `/aggregation-explorer?post_id=${post.id}`,
          },
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
      {isQuestionPost(post) && (
        <>
          <QuestionResolutionModal
            question={post.question}
            isOpen={isResolutionModalOpen}
            onClose={() => setIsResolutionModalOpen(false)}
          />
          <QuestionUnresolveModal
            question={post.question}
            isOpen={isUnresolveModalOpen}
            onClose={() => setIsUnresolveModalOpen(false)}
          />
        </>
      )}
      <DropdownMenu
        items={menuItems}
        className="divide-y divide-gray-300 border-gray-300 dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark"
        itemClassName="px-3 py-2"
      >
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
