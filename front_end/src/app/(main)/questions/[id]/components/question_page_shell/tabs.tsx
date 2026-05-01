"use client";

import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import QuestionPageShellTabBar from "./tab_bar";
import CommentsTab from "./tabs/comments";
import KeyFactorsTab from "./tabs/key_factors";
import PrivateNotesTab from "./tabs/private_notes";
import QuestionInfoTab from "./tabs/question_info";
import QuestionLinksTab from "./tabs/question_links";
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
  variant: Variant
) => {
  switch (activeTab) {
    case "key-factors":
      return <KeyFactorsTab post={post} />;
    case "info":
      return <QuestionInfoTab post={post} />;
    case "question-links":
      return variant === "forecaster" ? <QuestionLinksTab post={post} /> : null;
    case "private-notes":
      return variant === "forecaster" ? <PrivateNotesTab post={post} /> : null;
    case "comments":
    default:
      return <CommentsTab post={post} />;
  }
};

const QuestionPageShellTabs: FC<Props> = ({ post, variant, className }) => {
  const { activeTab } = useQuestionLayout();
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
      <div className="mt-8">{renderActivePanel(activeTab, post, variant)}</div>
    </div>
  );
};

export default QuestionPageShellTabs;
