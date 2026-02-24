import React, { useCallback, useEffect, useRef, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import BaseModal from "@/components/base_modal";
import { useOnboardingFeed } from "@/components/onboarding/hooks/use_onboarding_feed";
import StepsRouter from "@/components/onboarding/steps";
import { useAuth } from "@/contexts/auth_context";
import useStoredState from "@/hooks/use_stored_state";
import { OnboardingStoredState, OnboardingTopic } from "@/types/onboarding";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { logError } from "@/utils/core/errors";
import {
  ONBOARDING_STATE_KEY,
  setOnboardingSuppressed,
} from "@/utils/onboarding";

type OnboardingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const INITIAL_STATE = {
  selectedTopicName: null,
  currentStep: 0,
  step2Prediction: 50,
};

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostWithForecasts[]>([]);
  const [topic, setTopic] = useState<OnboardingTopic | null>(null);
  const { user, setUser } = useAuth();

  const { topics, postMap, isLoading, fetchError, refetch } =
    useOnboardingFeed(isOpen);

  const [onboardingState, setOnboardingState, deleteOnboardingState] =
    useStoredState<OnboardingStoredState>(ONBOARDING_STATE_KEY, INITIAL_STATE);
  const { selectedTopicName, currentStep } = onboardingState;

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

  // Topic selection handler
  useEffect(() => {
    if (isOpen && selectedTopicName !== null && !posts.length) {
      const topicObject = topics.find((t) => t.name === selectedTopicName);
      if (!topicObject) {
        // Persisted selection no longer matches any topic; reset
        setTopic(null);
        setPosts([]);
        setOnboardingState(INITIAL_STATE);
        return;
      }

      setTopic(topicObject);

      // Look up posts from postMap (no additional API call needed)
      const topicPosts = topicObject.questions
        .map((id) => postMap.get(id))
        .filter((p): p is PostWithForecasts => p != null);

      setPosts(topicPosts);

      // Go to next page
      if (currentStep === 0) {
        onNext();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedTopicName, posts.length, topics.length]);

  // Hide tutorial for 24h
  const handlePostponeTutorial = () => {
    sendAnalyticsEvent("onboardingClosed", {
      event_category: "onboarding",
    });
    // Mark as temporarily suppressed
    setOnboardingSuppressed();
    onClose();
  };

  const resetState = useCallback(() => {
    setTopic(null);
    setPosts([]);
    deleteOnboardingState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteOnboardingState]);

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
      // Go back to topic selection without clearing fetched data
      setTopic(null);
      setPosts([]);
      setOnboardingState(INITIAL_STATE);
    }
    scrollToTop();
  };

  const setTopicByName = (name: string) => {
    setOnboardingState((prev) => ({
      ...prev,
      selectedTopicName: name,
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handlePostponeTutorial}
      isImmersive={true}
      modalContentRef={modalContentRef}
    >
      <StepsRouter
        topic={topic}
        topics={topics}
        isLoading={isLoading}
        fetchError={fetchError}
        onRetry={refetch}
        onNext={onNext}
        onPrev={onPrev}
        onComplete={handleCompleteTutorial}
        setTopic={setTopicByName}
        onboardingState={onboardingState}
        setOnboardingState={setOnboardingState}
        posts={posts}
        handleComplete={handleCompleteTutorial}
        handlePostpone={handlePostponeTutorial}
      />
    </BaseModal>
  );
};

export default OnboardingModal;
