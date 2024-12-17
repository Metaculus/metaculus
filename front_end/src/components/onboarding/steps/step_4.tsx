import { sendGAEvent } from "@next/third-parties/google";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import useFeed from "@/app/(main)/questions/hooks/use_feed";
import Step from "@/components/onboarding/steps/step";
import { FeedType, POST_FORECASTER_ID_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { OnboardingStep } from "@/types/onboarding";

const Step4: React.FC<OnboardingStep> = ({ topic, handleComplete }) => {
  const router = useRouter();
  const { switchFeed, clearInReview } = useFeed();
  const { user } = useAuth();
  const t = useTranslations();

  const nextQuestionUrl = `/questions/${topic.questions[2]}`;

  const forceNavigate = (url: string) => {
    handleComplete();
    router.push(url);
  };

  const handleViewQuestionFeed = () => {
    sendGAEvent({
      event: "onboardingFinished",
      event_category: "onboarding",
      event_label: "Viewed Feed",
    });
    forceNavigate("/questions/");
  };

  const handleViewMyPredictions = () => {
    sendGAEvent({
      event: "onboardingFinished",
      event_category: "onboarding",
      event_label: "Viewed Predictions",
    });

    if (user) {
      clearInReview();
      switchFeed(FeedType.MY_PREDICTIONS);

      const searchParams = new URLSearchParams();
      searchParams.set(POST_FORECASTER_ID_FILTER, user.id.toString());
      searchParams.set("order_by", "-weekly_movement");
      const url = `/questions/?${searchParams.toString()}`;

      forceNavigate(url);
    } else {
      forceNavigate("/questions/");
    }
  };

  const handleViewAnotherQuestion = () => {
    sendGAEvent({
      event: "onboardingFinished",
      event_category: "onboarding",
      event_label: "Viewed Another Question",
    });
    forceNavigate(nextQuestionUrl);
  };

  return (
    <Step>
      <Step.Title>{t("onboardingStep5NiceWork")}</Step.Title>
      <Step.Paragraph>{t("onboardingStep5AnyoneCanImprove")}</Step.Paragraph>
      <div className="flex flex-col gap-2 rounded-md bg-blue-200 p-3 dark:bg-blue-200-dark md:p-5">
        <span className="block text-xs font-bold uppercase tracking-wide opacity-70">
          {t("onboardingStep5DidYouKnow")}
        </span>
        {t("onboardingStep5ForecastingCompetition")}
      </div>
      <Step.Paragraph>
        <span className="font-bold">{t("onboardingStep5ReadyToExplore")}</span>{" "}
      </Step.Paragraph>
      <div className="mx-auto flex w-full flex-col justify-stretch gap-4 md:flex-row ">
        <Step.Button
          onClick={handleViewMyPredictions}
          variant="small"
          className="w-full md:w-fit"
        >
          {t("onboardingStep5ViewYourPredictions")}
        </Step.Button>
        <Step.Button
          onClick={handleViewAnotherQuestion}
          variant="small"
          className="w-full font-light md:w-fit"
        >
          {t("onboardingStep5ForecastAnother")}{" "}
          <span className="font-bold">{topic.name}</span>{" "}
          {t("onboardingStep5Question")}
        </Step.Button>
        <Step.Button
          onClick={handleViewQuestionFeed}
          variant="small"
          className="w-full md:w-fit"
        >
          {t("onboardingStep5ViewQuestionFeed")}
        </Step.Button>
      </div>
    </Step>
  );
};

export default Step4;
