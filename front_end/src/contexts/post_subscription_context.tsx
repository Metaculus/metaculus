"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import PostSubscribeCustomizeModal from "@/components/post_subscribe/post_subscribe_customise_modal";
import PostSubscribeSuccessModal from "@/components/post_subscribe/subscribe_button/post_subscribe_success_modal";
import {
  getInitialNotebookSubscriptions,
  getInitialQuestionSubscriptions,
} from "@/components/post_subscribe/subscribe_button/utils";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Post, PostSubscription } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

type PostSubscriptionContextType = {
  isSubscribed: boolean;
  isLoading: boolean;
  toggleSubscription: () => Promise<void>;
  handleSubscribe: () => Promise<void>;
  handleCustomize: () => void;
};

const PostSubscriptionContext =
  createContext<PostSubscriptionContextType | null>(null);

type PostSubscriptionProviderProps = {
  post: Post;
  children: ReactNode;
};

type FollowModalType = "success" | "customisation";

export const PostSubscriptionProvider: React.FC<
  PostSubscriptionProviderProps
> = ({ post, children }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [postSubscriptions, setPostSubscriptions] = useState<
    PostSubscription[]
  >(post.subscriptions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<FollowModalType | undefined>();

  const isSubscribed = postSubscriptions.length > 0;

  const updateSubscriptions = useCallback(
    (newSubscriptions: PostSubscription[]) => {
      setPostSubscriptions(newSubscriptions);
    },
    []
  );

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    }

    setIsLoading(true);
    try {
      const newSubscriptions = await changePostSubscriptions(
        post.id,
        post.notebook
          ? getInitialNotebookSubscriptions()
          : getInitialQuestionSubscriptions()
      );
      sendAnalyticsEvent("questionFollowed");
      updateSubscriptions(newSubscriptions);
      // Show success modal after subscribing
      setActiveModal("success");
      return newSubscriptions;
    } finally {
      setIsLoading(false);
    }
  }, [post.id, post.notebook, setCurrentModal, user, updateSubscriptions]);

  const handleCustomize = useCallback(() => {
    setActiveModal("customisation");
  }, []);

  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      // If subscribed, show customization modal instead of unsubscribing
      setActiveModal("customisation");
    } else {
      await handleSubscribe();
    }
  }, [isSubscribed, handleSubscribe]);

  const closeModal = useCallback(() => {
    setActiveModal(undefined);
  }, []);

  const contextValue: PostSubscriptionContextType = {
    isSubscribed,
    isLoading,
    toggleSubscription: async () => {
      await toggleSubscription();
    },
    handleSubscribe: async () => {
      await handleSubscribe();
    },
    handleCustomize,
  };

  return (
    <PostSubscriptionContext.Provider value={contextValue}>
      {children}

      {/* Modals are automatically included and managed */}
      <PostSubscribeSuccessModal
        isOpen={activeModal === "success"}
        onClose={closeModal}
        post={post}
        onCustomiseClick={() => setActiveModal("customisation")}
        onPostSubscriptionChange={updateSubscriptions}
      />

      <PostSubscribeCustomizeModal
        isOpen={activeModal === "customisation"}
        onClose={closeModal}
        post={post}
        subscriptions={postSubscriptions}
        onPostSubscriptionChange={updateSubscriptions}
      />
    </PostSubscriptionContext.Provider>
  );
};

export const usePostSubscriptionContext = (): PostSubscriptionContextType => {
  const context = useContext(PostSubscriptionContext);
  if (!context) {
    throw new Error(
      "usePostSubscriptionContext must be used within a PostSubscriptionProvider"
    );
  }
  return context;
};
