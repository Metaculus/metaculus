"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useRef, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import { getPost } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import { useAuth } from "@/contexts/auth_context";
import useStoredState from "@/hooks/use_stored_state";
import { OnboardingStoredState } from "@/types/onboarding";
import { PostWithForecasts } from "@/types/post";
import { logError } from "@/utils/errors";
import {
  ONBOARDING_STATE_KEY,
  setOnboardingSuppressed,
} from "@/utils/onboarding";

import { onboardingTopics } from "./OnboardingSettings";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";

const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  const [
    { currentStep, selectedTopic, step3Prediction },
    setOnboardingState,
    pathOnboardingState,
    deleteOnboardingState,
  ] = useStoredState<OnboardingStoredState>(ONBOARDING_STATE_KEY, {
    selectedTopic: null,
    currentStep: 1,
    step2Prediction: 50,
    step3Prediction: 50,
  });

  const t = useTranslations();

  const [questionData, setQuestionData] = useState<PostWithForecasts | null>(
    null
  );
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const router = useRouter();

  const modalContentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  };

  // Save state into local storage
  useEffect(() => {
    if (!user?.is_onboarding_complete) {
      if (currentStep > 1 && currentStep < 5) {
        pathOnboardingState({ selectedTopic, currentStep });
      } else {
        deleteOnboardingState();
      }
    }
  }, [user?.is_onboarding_complete, selectedTopic, currentStep]);

  useEffect(() => {
    async function fetchQuestionData() {
      if (
        selectedTopic !== null &&
        (currentStep === 2 || currentStep === 3 || currentStep === 4)
      ) {
        setIsLoadingQuestion(true);
        const questionIndex = currentStep === 4 ? 1 : currentStep - 2;
        const questionId =
          onboardingTopics[selectedTopic].questions[questionIndex];

        try {
          const data = await getPost(questionId);
          setQuestionData(data);
        } catch (error) {
          console.error("Error fetching question data:", error);
        } finally {
          setIsLoadingQuestion(false);
        }
      }
    }

    void fetchQuestionData();
  }, [selectedTopic, currentStep]);

  const handleNext = () => {
    // Treat tutorial as done when user opens 4th page
    if (currentStep == 4 && !user?.is_onboarding_complete) {
      // Mark tutorial as complete
      updateProfileAction({ is_onboarding_complete: true }).catch(logError);
    }

    if (currentStep < 5) {
      pathOnboardingState({ currentStep: currentStep + 1 });
      scrollToTop();
      if (currentStep === 2) {
        // Reset prediction when moving from Step 2 to Step 3
        pathOnboardingState({ step3Prediction: 50 });
      }
    } else {
      onClose();
      router.push("/questions/");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      pathOnboardingState({ currentStep: currentStep - 1 });
      scrollToTop();
    }
  };

  const handleTopicSelect = (topicIndex: number) => {
    pathOnboardingState({ selectedTopic: topicIndex });
    handleNext();
  };

  const handleSkipTutorial = () => {
    // Mark tutorial as complete
    sendGAEvent({ event: "onboardingSkipped", event_category: "onboarding" });
    updateProfileAction({ is_onboarding_complete: true }).catch(logError);
    deleteOnboardingState();
    onClose();
  };

  const handleCloseTutorial = () => {
    // Temporarily hide tutorial
    sendGAEvent({ event: "onboardingClosed", event_category: "onboarding" });
    // Mark as temporarily suppressed
    setOnboardingSuppressed();
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 onTopicSelect={handleTopicSelect} />;
      case 2:
        return (
          <Step2
            onPrev={handlePrev}
            onNext={handleNext}
            topicIndex={selectedTopic}
            questionData={questionData}
            onPredictionChange={(value) =>
              pathOnboardingState({ step2Prediction: value })
            }
          />
        );
      case 3:
        return (
          <Step3
            onPrev={handlePrev}
            onNext={handleNext}
            topicIndex={selectedTopic}
            questionData={questionData}
            prediction={step3Prediction}
            onPredictionChange={(value) =>
              pathOnboardingState({ step3Prediction: value })
            }
            isLoading={isLoadingQuestion}
          />
        );
      case 4:
        return (
          <Step4
            onPrev={handlePrev}
            onNext={handleNext}
            topicIndex={selectedTopic}
            questionData={questionData}
            prediction={step3Prediction}
            onPredictionChange={(value) =>
              pathOnboardingState({ step3Prediction: value })
            }
          />
        );
      case 5:
        return (
          <Step5
            onPrev={handlePrev}
            onNext={handleNext}
            topicIndex={selectedTopic}
            closeModal={onClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleCloseTutorial}
      isImmersive={true}
      modalContentRef={modalContentRef}
    >
      {renderStep()}
      <div className="mt-4 flex w-full justify-center gap-3 md:mt-8">
        <button
          onClick={handleSkipTutorial}
          className="text-base text-blue-700 underline decoration-blue-700/70 underline-offset-4 hover:text-blue-800 hover:decoration-blue-700/90 dark:text-blue-700-dark dark:decoration-blue-700/70 dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark/90 "
        >
          {t("skipTutorial")}
        </button>
        <button
          onClick={handleCloseTutorial}
          className="text-base text-blue-700 underline decoration-blue-700/70 underline-offset-4 hover:text-blue-800 hover:decoration-blue-700/90 dark:text-blue-700-dark dark:decoration-blue-700/70 dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark/90 "
        >
          {t("remindMeLater")}
        </button>
      </div>
      <p className="text-center opacity-60">
        {t("onboardingRemindMeLaterDescription")}
      </p>
    </BaseModal>
  );
};

export default OnboardingModal;
