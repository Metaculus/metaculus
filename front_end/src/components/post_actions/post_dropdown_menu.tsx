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
import { Post, ProjectPermissions, QuestionStatus } from "@/types/post";
type Props = {
  post: Post;
};

export const PostDropdownMenu: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();

  const isUpcoming = post.question?.status === QuestionStatus.UPCOMING;
  const isAdmin = [ProjectPermissions.ADMIN].includes(post.user_permission);
  const isCurator = [ProjectPermissions.CURATOR].includes(post.user_permission);

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
    (score: number) => {
      changePostActivityBoost(post.id, score).then(({ score_total }) => {
        if (score > 0) {
          toast(t("contentBoosted", { score, score_total }));
        } else {
          toast(t("contentBuried", { score, score_total }));
        }
      });
    },
    [post.id, t]
  );

  const createDuplicateLink = (post: Post) => {
    if (post.question) {
      return `/questions/create/question?mode=create&post_id=${post.id}`;
    } else if (post.conditional) {
      return `/questions/create/conditional?mode=create&post_id=${post.id}`;
    } else if (post.group_of_questions) {
      return `/questions/create/group?mode=create&post_id=${post.id}`;
    } else if (post.notebook) {
      return `/questions/create/notebook?mode=create&post_id=${post.id}`;
    }
    return `/questions/create/question?mode=create&post_id=${post.id}`;
  };

  const menuItems: MenuItemProps[] = [];
  if (!post.notebook) {
    menuItems.push({
      id: "downloadQuestionData",
      name: t("downloadQuestionData"),
      onClick: openDownloadModal,
    });
  }
  if (user?.is_superuser) {
    menuItems.unshift(
      ...[
        {
          id: "boost",
          name: t("boost"),
          onClick: () => {
            changePostActivity(50);
          },
        },
        {
          id: "bury",
          name: t("bury"),
          onClick: () => {
            changePostActivity(-50);
          },
        },
        {
          id: "duplicate",
          name: t("duplicate"),
          link: createDuplicateLink(post),
        },
      ]
    );
  }

  if (isUpcoming && (isAdmin || isCurator)) {
    menuItems.unshift({
      id: "sendBackToReview",
      name: t("sendBackToReview"),
      onClick: () => {
        setConfirmModalOpen({
          open: true,
          type: "sendBackToReview",
        });
      },
    });
  }

  if (isAdmin) {
    menuItems.unshift({
      id: "deleteQuestion",
      name: t("delete"),
      onClick: () => {
        setConfirmModalOpen({
          open: true,
          type: "delete",
        });
      },
    });
  }

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
        <Button
          variant="secondary"
          className="rounded border-0"
          presentationType="icon"
        >
          <FontAwesomeIcon icon={faEllipsis} className="text-lg" />
        </Button>
      </DropdownMenu>
    </>
  );
};
