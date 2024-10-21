import React from "react";
import { useRouter } from "next/navigation";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import useSearchParams from "@/hooks/use_search_params";
import { FeedType, POST_FORECASTER_ID_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { useTranslations } from "next-intl";

interface Step5Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
}

const Step5: React.FC<Step5Props> = ({ onPrev, onNext, topicIndex }) => {
  const router = useRouter();
  const { switchFeed, clearInReview } = useFeed();
  const { setParam, deleteParam } = useSearchParams();
  const { user } = useAuth();
  const t = useTranslations();

  if (topicIndex === null) {
    console.log("Error: No topic selected");
    return <p>Error: No topic selected</p>;
  }

  const topic = onboardingTopics[topicIndex];
  const thirdQuestionId = topic.questions[2];

  const questionUrl = `/questions/${thirdQuestionId}`;

  const forceNavigate = (url: string) => {
    router.push(url);
    setTimeout(() => {
      window.location.href = url;
    }, 100);
  };

  const handleViewQuestionFeed = () => {
    console.log("View Question Feed clicked");
    const url = "/questions/";
    console.log("Redirecting to:", url);
    forceNavigate(url);
  };

  const handleViewMyPredictions = () => {
    console.log("View Your Predictions clicked");
    console.log("User:", user);

    if (user) {
      console.log("Clearing in review");
      clearInReview();
      console.log("Switching feed to MY_PREDICTIONS");
      switchFeed(FeedType.MY_PREDICTIONS);

      console.log("Constructing URL with params");
      const searchParams = new URLSearchParams();
      searchParams.set(POST_FORECASTER_ID_FILTER, user.id.toString());
      searchParams.set("order_by", "-weekly_movement");
      const url = `/questions/?${searchParams.toString()}`;

      console.log("Force redirecting to:", url);
      forceNavigate(url);
    } else {
      console.log("No user found, force redirecting to /questions/");
      forceNavigate("/questions/");
    }
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <h3 className={`${onboardingStyles.title}`}>
        {t("onboardingStep5NiceWork")}
      </h3>
      <p className={onboardingStyles.paragraph}>
        {t("onboardingStep5AnyoneCanImprove")}
      </p>
      <div className="flex flex-col gap-2 rounded-md bg-blue-200 p-3 dark:bg-blue-200-dark md:p-5">
        <span className="block text-xs font-bold uppercase tracking-wide opacity-70">
          {t("onboardingStep5DidYouKnow")}
        </span>
        {t("onboardingStep5ForecastingCompetition")}
      </div>
      <p className={onboardingStyles.paragraph}>
        <span className="font-bold">{t("onboardingStep5ReadyToExplore")}</span>{" "}
      </p>
      <div className="mx-auto flex w-full flex-col justify-stretch gap-4 md:flex-row ">
        <button
          onClick={handleViewMyPredictions}
          className={`${onboardingStyles.smallButton} w-full md:w-fit`}
        >
          {t("onboardingStep5ViewYourPredictions")}
        </button>
        <button
          onClick={() => {
            console.log("Forecast Another Question clicked");
            console.log("Redirecting to:", questionUrl);
            forceNavigate(questionUrl);
          }}
          className={`${onboardingStyles.smallButton} w-full font-light md:w-fit`}
        >
          {t("onboardingStep5ForecastAnother")}{" "}
          <span className="font-bold">{topic.name}</span>{" "}
          {t("onboardingStep5Question")}
        </button>
        <button
          onClick={handleViewQuestionFeed}
          className={`${onboardingStyles.smallButton} w-full md:w-fit`}
        >
          {t("onboardingStep5ViewQuestionFeed")}
        </button>
      </div>
    </div>
  );
};

export default Step5;
