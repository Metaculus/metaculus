import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import useSearchParams from "@/hooks/use_search_params";
import { FeedType, POST_FORECASTER_ID_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";

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
      <h3 className={onboardingStyles.title}>Nice work!</h3>
      <p className={onboardingStyles.paragraph}>
        Anyone can improve at forecasting by practicing and thinking through
        what factors could influence outcomes.
      </p>
      <div className="flex flex-col gap-2 rounded-md bg-blue-200 p-3 dark:bg-blue-200-dark">
        <span className="block text-xs font-bold uppercase tracking-wide opacity-70">
          Did you know?
        </span>
        In a series of forecasting competitions conducted by University of
        Pennsylvania professor Philip Tetlock, skilled forecasters outperformed
        CIA analysts without access to classified intelligence.
      </div>
      <p className={onboardingStyles.paragraph}>
        <span className="font-bold">
          You are now ready to explore Metaculus by yourself. What would you
          like to do next?
        </span>{" "}
      </p>
      <div className="mx-auto flex w-full flex-col justify-stretch gap-4 md:flex-row ">
        <button
          onClick={handleViewMyPredictions}
          className={`${onboardingStyles.smallButton} w-full md:w-fit`}
        >
          View Your Predictions
        </button>
        <button
          onClick={() => {
            console.log("Forecast Another Question clicked");
            console.log("Redirecting to:", questionUrl);
            forceNavigate(questionUrl);
          }}
          className={`${onboardingStyles.smallButton} w-full font-light md:w-fit`}
        >
          Forecast Another <span className="font-bold">{topic.name}</span>{" "}
          Question
        </button>
        <button
          onClick={handleViewQuestionFeed}
          className={`${onboardingStyles.smallButton} w-full md:w-fit`}
        >
          View Question Feed
        </button>
      </div>
    </div>
  );
};

export default Step5;
