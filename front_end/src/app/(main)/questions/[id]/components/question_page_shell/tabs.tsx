"use client";

import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";

import QuestionPageShellTabBar from "./tab_bar";
import CommentsTab from "./tabs/comments";
import DistributionsTab from "./tabs/distributions";
import KeyFactorsTab from "./tabs/key_factors";
import MyScoresTab from "./tabs/my_scores";
import NewsHotnessTab from "./tabs/news_hotness";
import PrivateNotesTab from "./tabs/private_notes";
import QuestionInfoTab from "./tabs/question_info";
import QuestionLinksTab from "./tabs/question_links";
import SimilarQuestionsTab from "../sidebar/similar_questions";
import TimelineTab from "./tabs/timeline";
import KeyFactorsFeed from "../key_factors/key_factors_feed";
import { useQuestionLayout } from "../question_layout/question_layout_context";

type Variant = "consumer" | "forecaster";

type Props = {
  post: PostWithForecasts;
  variant: Variant;
  className?: string;
};

const renderActivePanel = (
  activeTab: string | undefined,
  post: PostWithForecasts,
  variant: Variant,
  isAdmin: boolean
) => {
  switch (activeTab) {
    case "similar-questions":
      return <SimilarQuestionsTab post={post} variant={variant} />;
    case "timeline":
      return variant === "consumer" ? <TimelineTab post={post} /> : null;
    case "distributions":
      return variant === "consumer" ? <DistributionsTab post={post} /> : null;
    case "key-factors":
      return <KeyFactorsTab post={post} />;
    case "info":
      return <QuestionInfoTab post={post} />;
    case "news-hotness":
      return isAdmin ? <NewsHotnessTab post={post} /> : null;
    case "question-links":
      return variant === "forecaster" ? <QuestionLinksTab post={post} /> : null;
    case "private-notes":
      return variant === "forecaster" ? <PrivateNotesTab post={post} /> : null;
    case "my-scores":
      return variant === "consumer" ? <MyScoresTab post={post} /> : null;
    case "comments":
    default:
      return <CommentsTab post={post} />;
  }
};

const QuestionPageShellTabs: FC<Props> = ({ post, variant, className }) => {
  const { activeTab } = useQuestionLayout();
  const { user } = useAuth();
  const isAdmin = !!(user?.is_staff || user?.is_superuser);
  const isKeyFactors = activeTab === "key-factors";

  return (
    <div className={className}>
      <QuestionPageShellTabBar post={post} variant={variant} />
      {/* Mounted only when off the key-factors tab to power the overlay from any tab */}
      {!isKeyFactors && (
        <div className="hidden">
          <KeyFactorsFeed post={post} />
        </div>
      )}
      <div className="mt-4 md:mt-5">
        {renderActivePanel(activeTab, post, variant, isAdmin)}
      </div>
    </div>
  );
};

export default QuestionPageShellTabs;
