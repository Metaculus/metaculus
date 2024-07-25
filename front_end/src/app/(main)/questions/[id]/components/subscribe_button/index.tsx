"use client";

import { faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import { getDefaultSubscriptions } from "@/app/(main)/questions/[id]/components/subscribe_button/utils";
import {
  changePostActivityBoost,
  changePostSubscriptions,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Post, PostSubscription } from "@/types/post";

type Props = {
  post: Post;
};

const PostSubscribeButton: FC<Props> = ({ post }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const [modalOpen, setModalOpen] = useState(false);
  const [postSubscriptions, setPostSubscriptions] = useState<
    PostSubscription[]
  >(post.subscriptions || []);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = useCallback(async () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    } else {
      // Subscribe to default notifications set
      setIsLoading(true);
      const response = await changePostSubscriptions(
        post.id,
        getDefaultSubscriptions()
      );
      setIsLoading(false);

      if (response && "errors" in response) {
        return [];
      }

      setPostSubscriptions(response);

      // Click on this button automatically subscribes user to the default notifications
      //setModalOpen(true);
    }
  }, [post.id, setCurrentModal, user]);

  if (user && postSubscriptions.length) {
    return (
      <Button variant="primary" disabled={isLoading}>
        <FontAwesomeIcon icon={faBell} />
        {t("followingButton")}
      </Button>
    );
  }

  return (
    <Button variant="secondary" onClick={handleFollow} disabled={isLoading}>
      <FontAwesomeIcon icon={faBell} />
      {t("followButton")}
    </Button>
  );
};

export default PostSubscribeButton;
