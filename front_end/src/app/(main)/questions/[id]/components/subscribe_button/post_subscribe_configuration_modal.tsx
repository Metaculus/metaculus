"use client";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { Post, PostSubscription } from "@/types/post";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  post: Post;
  subscriptions: PostSubscription[];
};

const PostSubscribeConfigurationModal: FC<Props> = ({
  isOpen,
  onClose,
  post,
  subscriptions,
}) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnfollow = useCallback(async () => {
    setIsLoading(true);
    try {
      await changePostSubscriptions(post.id, []);
    } finally {
      setIsLoading(false);
    }

    onClose(true);
  }, [onClose, post.id]);

  return (
    <BaseModal
      label="You’re now following this question!"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-w-xl">
        <p className="text-base leading-tight">
          You’ll be notified of new comments, changes to the Community
          Prediction, every time 20% of the question lifetime has passed, and
          when the question opens, closes, or resolves.
        </p>
        <div className="flex w-fit gap-2">
          <Button
            variant="secondary"
            disabled={isLoading}
            onClick={handleUnfollow}
          >
            {t("unfollowButton")}
          </Button>
          <Button variant="link" disabled={isLoading}>
            {t("customiseButton")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PostSubscribeConfigurationModal;
