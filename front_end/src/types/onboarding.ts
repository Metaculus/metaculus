import { PostWithForecasts } from "@/types/post";

export type OnboardingStoredState = {
  selectedTopicName: string | null;
  currentStep: number;
  step2Prediction: number;
  step3Prediction?: number;
};

export type OnboardingTopic = {
  name: string;
  questions: number[];
  emoji: string;
};

export type OnboardingStep = {
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  topic: OnboardingTopic | null;
  topics: OnboardingTopic[];
  setTopic: (name: string) => void;
  handleComplete: () => void;
  handlePostpone: () => void;
  posts: PostWithForecasts[];
  isLoading?: boolean;
  fetchError?: boolean;
  onRetry?: () => void;
  onboardingState: OnboardingStoredState;
  setOnboardingState: (
    arg:
      | OnboardingStoredState
      | ((prev: OnboardingStoredState) => OnboardingStoredState)
  ) => void;
};
