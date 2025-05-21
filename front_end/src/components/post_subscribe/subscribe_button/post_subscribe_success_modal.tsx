"use client";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { Post, PostSubscription } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  post: Post;
  // Triggered on "customise" button click
  onCustomiseClick: () => void;
  onPostSubscriptionChange: (subscription: PostSubscription[]) => void;
};

const PostSubscribeSuccessModal: FC<Props> = ({
  isOpen,
  onClose,
  post,
  onCustomiseClick,
  onPostSubscriptionChange,
}) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnfollow = useCallback(async () => {
    setIsLoading(true);
    try {
      const newSubscriptions = await changePostSubscriptions(
        post.id,
        [],
        false
      );
      sendAnalyticsEvent("questionUnfollowed");
      onPostSubscriptionChange(newSubscriptions);
    } finally {
      setIsLoading(false);
    }

    onClose(true);
  }, [onClose, onPostSubscriptionChange, post.id]);

  return (
    <BaseModal
      label={
        post.group_of_questions
          ? t("followModalYouAreFollowingThisGroup")
          : post.notebook
            ? t("followModalYouAreFollowingThisNotebook")
            : t("followModalYouAreFollowingThisQuestion")
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-w-xl">
        <p className="text-base leading-tight">
          {post.group_of_questions
            ? t("followModalSuccessMessageDefaultNotificationGroup")
            : post.notebook
              ? t("followModalSuccessMessageDefaultNotificationNotebook")
              : t("followModalSuccessMessageDefaultNotificationQuestion")}
        </p>
        <div className="flex w-full justify-end">
          <div className="flex w-fit gap-2">
            <Button
              variant="link"
              disabled={isLoading}
              onClick={onCustomiseClick}
            >
              {t("customiseButton")}
            </Button>
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={handleUnfollow}
            >
              {t("followModalUnfollowButton")}
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default PostSubscribeSuccessModal;
