import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BaseModal from "@/components/base_modal";
import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import { getPost } from "@/app/(main)/questions/actions";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "./OnboardingSettings";

const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [questionData, setQuestionData] = useState<PostWithForecasts | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    async function fetchQuestionData() {
      if (selectedTopic !== null && (currentStep === 2 || currentStep === 3)) {
        const questionIndex = currentStep - 2; // 0 for step 2, 1 for step 3
        const questionId =
          onboardingTopics[selectedTopic].questions[questionIndex];
        try {
          const data = await getPost(questionId);
          setQuestionData(data);
        } catch (error) {
          console.error("Error fetching question data:", error);
        }
      }
    }

    fetchQuestionData();
  }, [selectedTopic, currentStep]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      router.push("/questions/");
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTopicSelect = (topicIndex: number) => {
    setSelectedTopic(topicIndex);
    handleNext();
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
          />
        );
      case 3:
        return (
          <Step3
            onPrev={handlePrev}
            onNext={handleNext}
            topicIndex={selectedTopic}
            questionData={questionData}
          />
        );
      case 4:
        return (
          <Step4
            onPrev={handlePrev}
            onNext={onClose}
            topicIndex={selectedTopic}
          />
        );
      default:
        return null;
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      {renderStep()}
    </BaseModal>
  );
};

export default OnboardingModal;
