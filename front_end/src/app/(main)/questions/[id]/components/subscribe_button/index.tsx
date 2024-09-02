"use client";

import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import PostSubscribeCustomizeModal from "@/components/post_subscribe/post_subscribe_customise_modal";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Post, PostSubscription } from "@/types/post";

import PostSubscribeSuccessModal from "./post_subscribe_success_modal";
import { getInitialSubscriptions } from "./utils";

type Props = {
  post: Post;
  mini?: boolean;
};

type FollowModalType = "success" | "customisation";

const PostSubscribeButton: FC<Props> = ({ post, mini = false }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const [activeModal, setActiveModal] = useState<FollowModalType | undefined>();
  const [postSubscriptions, setPostSubscriptions] = useState<
    PostSubscription[]
  >(() => post.subscriptions || []);
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
        // Open success modal
        setActiveModal("success");
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
          presentationType={mini ? "icon" : "default"}
          disabled={isLoading}
          onClick={() => setActiveModal("customisation")}
        >
          <FontAwesomeIcon
            icon={faBell}
            className="text-yellow-400 dark:text-yellow-600"
          />
          {!mini && t("followingButton")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          presentationType={mini ? "icon" : "default"}
          onClick={handleFollow}
          disabled={isLoading}
          className={mini ? "border-0" : ""}
        >
          <FontAwesomeIcon
            icon={faBell}
            className="text-yellow-600 dark:text-yellow-400"
          />
          {!mini && t("followButton")}
        </Button>
      )}
      <PostSubscribeSuccessModal
        isOpen={activeModal === "success"}
        onClose={() => {
          setActiveModal(undefined);
        }}
        post={post}
        onCustomiseClick={() => setActiveModal("customisation")}
      />

      <PostSubscribeCustomizeModal
        isOpen={activeModal === "customisation"}
        onClose={() => {
          setActiveModal(undefined);
        }}
        post={post}
        subscriptions={postSubscriptions}
      />
    </>
  );
};

export default PostSubscribeButton;
