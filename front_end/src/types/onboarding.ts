import { PostWithForecasts } from "@/types/post";

export type OnboardingStoredState = {
  selectedTopicId: number | null;
  currentStep: number;
  step2Prediction: number;
  step3Prediction?: number;
};

export type OnboardingTopic = {
  name: string;
  questions: number[];
  factors: string[];
  emoji: string;
};

export type OnboardingStep = {
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  topic: OnboardingTopic | null;
  setTopic: (id: number) => void;
  handleComplete: () => void;
  handlePostpone: () => void;
  posts: PostWithForecasts[];
  onboardingState: OnboardingStoredState;
  setOnboardingState: (
    arg:
      | OnboardingStoredState
      | ((prev: OnboardingStoredState) => OnboardingStoredState)
  ) => void;
};
