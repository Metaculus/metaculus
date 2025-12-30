import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil, round } from "lodash";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import { createForecasts } from "@/app/(main)/questions/actions";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import { BINARY_FORECAST_PRECISION } from "@/components/forecast_maker/binary_slider";
import Step from "@/components/onboarding/steps/step";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { FeedType, POST_FORECASTER_ID_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { OnboardingStep } from "@/types/onboarding";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { logError } from "@/utils/core/errors";

type ForecastedPost = {
  post: PostWithForecasts | null;
  forecast?: number;
  isLoading: boolean;
  isSubmitted: boolean;
};

const Step5: React.FC<OnboardingStep> = ({
  topic,
  handleComplete,
  posts,
  onboardingState: { step2Prediction, step3Prediction },
}) => {
  const router = useRouter();
  const { switchFeed, clearInReview } = useFeed();
  const { user } = useAuth();
  const t = useTranslations();

  const nextQuestionUrl = `/questions/${topic?.questions?.[2]}`;

  const forceNavigate = (url: string) => {
    handleComplete();
    router.push(url);
  };

  useEffect(() => {
    // Mark tutorial as complete once user reaches this step
    updateProfileAction({ is_onboarding_complete: true }, false).catch(
      logError
    );
  }, []);

  const handleViewQuestionFeed = () => {
    sendAnalyticsEvent("onboardingFinished", {
      event_category: "onboarding",
      event_label: "Viewed Feed",
    });
    forceNavigate("/questions/");
  };

  const handleViewMyPredictions = () => {
    sendAnalyticsEvent("onboardingFinished", {
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
    sendAnalyticsEvent("onboardingFinished", {
      event_category: "onboarding",
      event_label: "Viewed Another Question",
    });
    forceNavigate(nextQuestionUrl);
  };

  const [forecastedPosts, setForecastedPosts] = useState<ForecastedPost[]>(
    () => {
      const postsOrder = topic?.questions ?? [];
      const sortedPosts = [...posts].sort(
        (a, b) => postsOrder.indexOf(a.id) - postsOrder.indexOf(b.id)
      );

      return [step2Prediction, step3Prediction].map((forecast, idx) => ({
        post: sortedPosts[idx] ?? null,
        forecast,
        isLoading: false,
        isSubmitted: false,
      }));
    }
  );

  const updateForecastedPostState = (
    postId: number,
    update: Partial<ForecastedPost>
  ) => {
    setForecastedPosts((prev) =>
      prev.map((obj) => ({
        ...obj,
        ...(postId === obj.post?.id ? update : {}),
      }))
    );
  };

  const handleDiscard = ({ post }: ForecastedPost) => {
    setForecastedPosts((prev) =>
      prev.filter((obj) => obj.post?.id !== post?.id)
    );
  };

  const handleSubmit = async ({ post, forecast }: ForecastedPost) => {
    if (isNil(post)) {
      logError(new Error("Post not found"), {
        message: "Error submitting onboarding forecast",
      });
      return;
    }
    if (isNil(post.question)) {
      logError(new Error("Question not found"), {
        message: "Error submitting onboarding forecast",
      });
      return;
    }
    if (isNil(forecast)) {
      logError(new Error("Forecast not found"), {
        message: "Error submitting onboarding forecast",
      });
      return;
    }

    // Set loading
    updateForecastedPostState(post.id, { isLoading: true });

    try {
      const response = await createForecasts(
        post.id,
        [
          {
            questionId: post.question.id,
            forecastData: {
              continuousCdf: null,
              probabilityYes: round(forecast / 100, BINARY_FORECAST_PRECISION),
              probabilityYesPerCategory: null,
            },
          },
        ],
        false
      );

      if (!response?.errors) {
        updateForecastedPostState(post.id, { isSubmitted: true });
      }
    } finally {
      updateForecastedPostState(post.id, { isLoading: false });
    }
  };

  return (
    <Step>
      <Step.Title>{t("onboardingStep5WellDone")}</Step.Title>
      <Step.Paragraph>
        {t("onboardingStep5SavePredictionsParagraph")}
      </Step.Paragraph>
      <div className="flex flex-col gap-4">
        {forecastedPosts
          .filter(({ forecast }) => typeof forecast !== "undefined")
          .map((obj) => (
            <Step.QuestionContainer key={`onboarding-forecast-${obj.post?.id}`}>
              <Step.QuestionTitle>{obj.post?.title}</Step.QuestionTitle>
              <div className="flex flex-row items-center justify-between">
                <div className="text-base md:text-lg">
                  {t("onboardingYouPredicted")}{" "}
                  <span className="rounded bg-blue-700/20 px-1 py-0.5 font-semibold text-blue-800 dark:bg-blue-400/20 dark:text-blue-200">
                    {obj.forecast?.toFixed(0)}%
                  </span>
                </div>
                <div className="flex gap-2">
                  <Step.Button
                    variant="small"
                    disabled={obj.isLoading || obj.isSubmitted}
                    onClick={() => handleSubmit(obj)}
                  >
                    {obj.isLoading ? (
                      <LoadingIndicator className="h-4" />
                    ) : obj.isSubmitted ? (
                      <FontAwesomeIcon icon={faCheck} />
                    ) : (
                      t("save")
                    )}
                  </Step.Button>
                  {!obj.isSubmitted && (
                    <Step.Button
                      variant="small"
                      disabled={obj.isLoading}
                      onClick={() => handleDiscard(obj)}
                    >
                      {t("discard")}
                    </Step.Button>
                  )}
                </div>
              </div>
            </Step.QuestionContainer>
          ))}
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
          <span className="font-bold">{topic?.name}</span>{" "}
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

export default Step5;
