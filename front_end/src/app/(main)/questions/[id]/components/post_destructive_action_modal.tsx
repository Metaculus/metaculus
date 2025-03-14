"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { Post } from "@/types/post";

import { deletePost, rejectPost, sendBackToReview } from "../../actions";

export type PostDestructiveActionModalProps = {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  destructiveAction: "reject" | "delete" | "sendBackToReview";
  onActionComplete?: () => void;
};

const PostDestructiveActionModal: FC<PostDestructiveActionModalProps> = ({
  post,
  isOpen,
  onClose,
  destructiveAction,
  onActionComplete,
}) => {
  const t = useTranslations();

  const destructiveActionText = useMemo(() => {
    switch (destructiveAction) {
      case "reject":
        return t("reject");
      case "delete":
        return t("delete");
      case "sendBackToReview":
        return t("sendBackToReview");
    }
  }, [destructiveAction, t]);

  const onDestructiveAction = async () => {
    switch (destructiveAction) {
      case "reject":
        await rejectPost(post.id);
        break;
      case "delete":
        await deletePost(post.id);
        break;
      case "sendBackToReview":
        await sendBackToReview(post.id);
        break;
    }
    onClose();
    onActionComplete?.();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col">
        <h2 className="text-lg font-bold capitalize">
          {destructiveActionText}
        </h2>
        <p className="">
          {t("deleteRejectPostDescription", {
            destructiveAction: destructiveActionText.toLowerCase(),
          })}
        </p>
        <div className="mt-8 flex flex-row justify-end gap-2">
          <Button variant="primary" onClick={onDestructiveAction}>
            {destructiveActionText}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PostDestructiveActionModal;
