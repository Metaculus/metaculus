import { sendGAEvent } from "@next/third-parties/google";
import React, { useEffect, useRef, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import { fetchPosts } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import OnboardingLoading from "@/components/onboarding/onboarding_loading";
import StepsRouter from "@/components/onboarding/steps";
import { ONBOARDING_TOPICS } from "@/components/onboarding/utils";
import { useAuth } from "@/contexts/auth_context";
import useStoredState from "@/hooks/use_stored_state";
import { OnboardingStoredState, OnboardingTopic } from "@/types/onboarding";
import { PostWithForecasts } from "@/types/post";
import { logError } from "@/utils/errors";
import {
  ONBOARDING_STATE_KEY,
  setOnboardingSuppressed,
} from "@/utils/onboarding";

type OnboardingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const INITIAL_STATE = {
  selectedTopicId: null,
  currentStep: 0,
  step2Prediction: 50,
};

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState<OnboardingTopic | null>(null);
  const { user, setUser } = useAuth();

  const [onboardingState, setOnboardingState, deleteOnboardingState] =
    useStoredState<OnboardingStoredState>(ONBOARDING_STATE_KEY, INITIAL_STATE);
  const { selectedTopicId, currentStep } = onboardingState;

  useEffect(() => {
    // Cleanup onboarding state after completion
    if (user?.is_onboarding_complete) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.is_onboarding_complete]);

  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  };

  // Topic change handler
  useEffect(() => {
    if (isOpen && selectedTopicId !== null && !posts.length) {
      const topicObject = ONBOARDING_TOPICS[selectedTopicId];
      if (!topicObject) return;

      setIsLoading(true);
      setTopic(topicObject);

      const updatePosts = async () => {
        try {
          const postIds = topicObject.questions.slice(0, 2);
          const fetchedPosts = await fetchPosts(
            { ids: postIds },
            0,
            postIds.length
          );
          setPosts(fetchedPosts.questions);
          // Go to next page
          if (currentStep === 0) {
            onNext();
          }
        } finally {
          setIsLoading(false);
        }
      };

      // Load posts
      void updatePosts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedTopicId, posts.length]);

  // Hide tutorial for 24h
  const handlePostponeTutorial = () => {
    sendGAEvent({ event: "onboardingClosed", event_category: "onboarding" });
    // Mark as temporarily suppressed
    setOnboardingSuppressed();
    onClose();
  };

  const resetState = () => {
    setTopic(null);
    setPosts([]);
    deleteOnboardingState();
  };

  // Mark tutorial as completed
  const handleCompleteTutorial = () => {
    updateProfileAction({ is_onboarding_complete: true }, false).catch(
      logError
    );
    // Update user state without global revalidation
    if (user) setUser({ ...user, is_onboarding_complete: true });
    resetState();
    onClose();
  };

  const onNext = () => {
    setOnboardingState((prev) => ({
      ...prev,
      currentStep: prev.currentStep + 1,
    }));
    scrollToTop();
  };

  const onPrev = () => {
    const nextStep = currentStep - 1;

    if (nextStep > 0) {
      setOnboardingState((prev) => ({ ...prev, currentStep: nextStep }));
    } else {
      resetState();
    }
    scrollToTop();
  };

  const setTopicId = (id: number) => {
    setOnboardingState((prev) => ({
      ...prev,
      selectedTopicId: id,
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handlePostponeTutorial}
      isImmersive={true}
      modalContentRef={modalContentRef}
    >
      {isLoading ? (
        <OnboardingLoading />
      ) : (
        <StepsRouter
          topic={topic}
          onNext={onNext}
          onPrev={onPrev}
          onComplete={handleCompleteTutorial}
          setTopic={setTopicId}
          onboardingState={onboardingState}
          setOnboardingState={setOnboardingState}
          posts={posts}
          handleComplete={handleCompleteTutorial}
          handlePostpone={handlePostponeTutorial}
        />
      )}
    </BaseModal>
  );
};

export default OnboardingModal;
