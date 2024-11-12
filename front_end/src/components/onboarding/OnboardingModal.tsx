import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";

import { getPost } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import { PostWithForecasts } from "@/types/post";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<PostWithForecasts | null>(
    null
  );
  const [step2Prediction, setStep2Prediction] = useState(50);
  const [step3Prediction, setStep3Prediction] = useState(50);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const router = useRouter();

  const modalContentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (modalContentRef.current) {
      modalContentRef.current.scrollTop = 0;
    }
  };

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

    fetchQuestionData();
  }, [selectedTopic, currentStep]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      scrollToTop();
      if (currentStep === 2) {
        // Reset prediction when moving from Step 2 to Step 3
        setStep3Prediction(50);
      }
    } else {
      onClose();
      router.push("/questions/");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollToTop();
    }
  };

  const handleTopicSelect = (topicIndex: number) => {
    setSelectedTopic(topicIndex);
    handleNext();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1 onTopicSelect={handleTopicSelect} onClose={onClose} />;
      case 2:
        return (
          <Step2
            onPrev={handlePrev}
            onNext={handleNext}
            topicIndex={selectedTopic}
            questionData={questionData}
            onPredictionChange={setStep2Prediction}
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
            onPredictionChange={setStep3Prediction}
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
            onPredictionChange={setStep3Prediction}
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
      onClose={onClose}
      isImmersive={true}
      modalContentRef={modalContentRef}
    >
      {renderStep()}
    </BaseModal>
  );
};

export default OnboardingModal;
