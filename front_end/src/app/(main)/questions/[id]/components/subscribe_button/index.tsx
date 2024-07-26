"use client";

import { faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Post, PostSubscription } from "@/types/post";

import PostSubscribeCustomizeModal from "./post_subscribe_customise_modal";
import PostSubscribeSuccessModal from "./post_subscribe_success_modal";
import { getInitialSubscriptions } from "./utils";

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

  // Catch post.subscriptions updates coming from `revalidatePath`
  useEffect(() => {
    setPostSubscriptions(post.subscriptions || []);
  }, [post.subscriptions]);

  const handleFollow = useCallback(async () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    } else {
      // Subscribe to default notifications set
      setIsLoading(true);
      try {
        const response = await changePostSubscriptions(
          post.id,
          getInitialSubscriptions()
        );

        // Click on this button automatically subscribes user to the default notifications
        setPostSubscriptions(response);
        setModalOpen(true);
      } finally {
        setIsLoading(false);
      }
    }
  }, [post.id, setCurrentModal, user]);

  return (
    <>
      {user && postSubscriptions.length ? (
        <Button
          variant="primary"
          disabled={isLoading}
          onClick={() => setModalOpen(true)}
        >
          <FontAwesomeIcon icon={faBell} />
          {t("followingButton")}
        </Button>
      ) : (
        <Button variant="secondary" onClick={handleFollow} disabled={isLoading}>
          <FontAwesomeIcon icon={faBell} />
          {t("followButton")}
        </Button>
      )}
      <PostSubscribeSuccessModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        post={post}
        subscriptions={postSubscriptions}
      />

      <PostSubscribeCustomizeModal
        isOpen={true}
        onClose={() => {}}
        post={post}
        subscriptions={postSubscriptions}
      />
    </>
  );
};

export default PostSubscribeButton;
