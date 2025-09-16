import Link from "next/link";
import { ReactNode } from "react";

import { EXPRESSION_OF_INTEREST_FORM_URL } from "@/app/(main)/pro-forecasters/constants/expression_of_interest_form";
import { CategoryKey } from "@/types/scoring";
import cn from "@/utils/core/cn";

const baseLinkClassName =
  "text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark";
const smallLinkClassName = cn(baseLinkClassName, "text-xs font-medium");

const ProForecastersInfo: ReactNode = (
  <div className="text-xs">
    We sometimes recruit upstanding members of the community who are excellent
    question writers to become paid moderators.
    <br />
    <div className="mt-2 font-medium">
      Fill out our{" "}
      <a href={EXPRESSION_OF_INTEREST_FORM_URL} className={smallLinkClassName}>
        expression of interest form
      </a>{" "}
      if you would like to be considered.
    </div>
  </div>
);

type TranslationKey =
  | "all"
  | "baselineAccuracy"
  | "peerAccuracy"
  | "comments"
  | "questionWriting"
  | "tournaments";

type ShortTranslationKey =
  | "all"
  | "baselineAccuracyShort"
  | "peerAccuracyShort"
  | "questionWritingShort"
  | "comments";

type RankingCategory = {
  id: string;
  translationKey: TranslationKey;
  shortTranslationKey: ShortTranslationKey;
  explanation: ReactNode;
};

export const RANKING_CATEGORIES: Record<CategoryKey, RankingCategory> = {
  all: {
    id: "all",
    translationKey: "all",
    shortTranslationKey: "all",
    explanation: (
      <div className="flex flex-col gap-3">
        <div>
          These leaderboards award medals to decorate valued members of the
          Metaculus community.
          <br />
          We also use these leaderboards to select{" "}
          <strong>Pro Forecasters</strong>.
          <br />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/help/medals-faq/" className={smallLinkClassName}>
            Learn more about Metaculus Medals
          </Link>
          <Link href="/pro-forecasters" className={smallLinkClassName}>
            Learn more about becoming a Pro Forecaster
          </Link>
        </div>
      </div>
    ),
  },
  baseline: {
    id: "baseline",
    translationKey: "baselineAccuracy",
    shortTranslationKey: "baselineAccuracyShort",
    explanation: (
      <div className="flex flex-col gap-3">
        <span>
          <strong>Baseline Accuracy</strong> measures how accurate a user was
          compared to chance. User scores are determined by summing their{" "}
          <Link
            href="/help/scores-faq/#baseline-score"
            className={baseLinkClassName}
          >
            Baseline scores
          </Link>{" "}
          for all questions within a time period. This category rewards
          forecasters who are both accurate and forecast on many questions.
          Learn more{" "}
          <Link
            href="/help/medals-faq/#baseline-medals"
            className={baseLinkClassName}
          >
            here
          </Link>
          .
        </span>
        {ProForecastersInfo}
      </div>
    ),
  },
  peer: {
    id: "peer",
    translationKey: "peerAccuracy",
    shortTranslationKey: "peerAccuracyShort",
    explanation: (
      <div className="flex flex-col gap-3">
        <span>
          <strong>Peer Accuracy</strong> measures how accurate a user was
          compared to others. Users are ranked by the sum of their{" "}
          <Link
            href="/help/scores-faq/#peer-score"
            className={baseLinkClassName}
          >
            Peer scores
          </Link>
          , divided by the sum of their{" "}
          <Link href="/help/scores-faq/#coverage" className={baseLinkClassName}>
            Coverages
          </Link>
          . This creates a weighted average, where each prediction is counted
          proportionally to how long it was standing. To reduce the impact of
          luck, all forecasters start with a prior of 30 questions with a score
          of 0. Learn more{" "}
          <Link
            href="/help/medals-faq/#peer-medals"
            className={baseLinkClassName}
          >
            here
          </Link>
          .
        </span>
        {ProForecastersInfo}
      </div>
    ),
  },
  comments: {
    id: "comments",
    translationKey: "comments",
    shortTranslationKey: "comments",
    explanation: (
      <div className="flex flex-col gap-3">
        <span>
          The <strong>Comments</strong> category rewards writing insightful
          comments determined by the number of upvotes. Medals are awarded
          annually with rankings determined by an{" "}
          <Link
            href="/help/medals-faq/#h-indexes"
            className={baseLinkClassName}
          >
            h-index
          </Link>{" "}
          to reward a balance of both the # of comments and their quality. Learn
          more{" "}
          <Link
            href="/help/medals-faq/#comments-medals"
            className={baseLinkClassName}
          >
            here
          </Link>
          .
        </span>
        {ProForecastersInfo}
      </div>
    ),
  },
  questionWriting: {
    id: "questionWriting",
    translationKey: "questionWriting",
    shortTranslationKey: "questionWritingShort",
    explanation: (
      <div className="flex flex-col gap-3">
        <span>
          The <strong>Question Writing</strong> category rewards authoring
          engaging questions as determined by the number of forecasters divided
          by ten. Medals are awarded annually with rankings determined by an{" "}
          <Link
            href="/help/medals-faq/#h-indexes"
            className={baseLinkClassName}
          >
            h-index
          </Link>{" "}
          to reward a balance of both the # of questions and their engagement.
          Learn more{" "}
          <Link
            href="/help/medals-faq/#question-writing-medals"
            className={baseLinkClassName}
          >
            here
          </Link>
          .
        </span>
        {ProForecastersInfo}
      </div>
    ),
  },
  tournament: {
    id: "tournament",
    translationKey: "tournaments",
    shortTranslationKey: "all",
    explanation: null,
  },
};
