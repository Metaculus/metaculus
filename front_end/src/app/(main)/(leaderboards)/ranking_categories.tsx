import Link from "next/link";
import { ReactNode } from "react";

import { CategoryKey } from "@/types/scoring";

const ProForecastersInfo: ReactNode = (
  <div>
    These leaderboards award medals to decorate valued members of the Metaculus
    community. We also use these leaderboards to select Pro Forecasters.
    <br />
    Read more about becoming a Pro Forecaster{" "}
    <Link href={"/pro-forecasters"}>here</Link>.
  </div>
);

export const RANKING_CATEGORIES: Record<
  CategoryKey,
  {
    id: string;
    translationKey: any; // TODO: provide a proper type
    shortTranslationKey: any; // TODO: provide a proper type
    explanation: ReactNode;
  }
> = {
  all: {
    id: "all",
    translationKey: "all",
    shortTranslationKey: "all",
    explanation: (
      <>
        <span>
          <Link href="/help/medals-faq/">Learn more</Link> about Metaculus
          Medals
        </span>
        {ProForecastersInfo}
      </>
    ),
  },
  baseline: {
    id: "baseline",
    translationKey: "baselineAccuracy",
    shortTranslationKey: "baselineAccuracyShort",
    explanation: (
      <>
        <span>
          <strong>Baseline Accuracy</strong> measures how accurate a user was
          compared to chance. User scores are determined by summing their{" "}
          <Link href="/help/scores-faq/#baseline-score">Baseline scores</Link>{" "}
          for all questions within a time period. This category rewards
          forecasters who are both accurate and forecast on many questions.
          Learn more <Link href="/help/medals-faq/#baseline-medals">here</Link>.
        </span>
        {ProForecastersInfo}
      </>
    ),
  },
  peer: {
    id: "peer",
    translationKey: "peerAccuracy",
    shortTranslationKey: "peerAccuracyShort",
    explanation: (
      <>
        <span>
          <strong>Peer Accuracy</strong> measures how accurate a user was
          compared to others. Users are ranked by the sum of their{" "}
          <Link href="/help/scores-faq/#peer-score">Peer scores</Link>, divided
          by the sum of their{" "}
          <Link href="/help/scores-faq/#coverage">Coverages</Link>. This creates
          a weighted average, where each prediction is counted proportionally to
          how long it was standing. To reduce the impact of luck, all
          forecasters start with a prior of 30 questions with a score of 0.
          Learn more <Link href="/help/medals-faq/#peer-medals">here</Link>.
        </span>
        {ProForecastersInfo}
      </>
    ),
  },
  comments: {
    id: "comments",
    translationKey: "comments",
    shortTranslationKey: "comments",
    explanation: (
      <>
        <span>
          The <strong>Comments</strong> category rewards writing insightful
          comments determined by the number of upvotes. Medals are awarded
          annually with rankings determined by an{" "}
          <Link href="/help/medals-faq/#h-indexes">h-index</Link> to reward a
          balance of both the # of comments and their quality. Learn more{" "}
          <Link href="/help/medals-faq/#comments-medals">here</Link>.
        </span>
        {ProForecastersInfo}
      </>
    ),
  },
  questionWriting: {
    id: "questionWriting",
    translationKey: "questionWriting",
    shortTranslationKey: "questionWritingShort",
    explanation: (
      <>
        <span>
          The <strong>Question Writing</strong> category rewards authoring
          engaging questions as determined by the number of forecasters divided
          by ten. Medals are awarded annually with rankings determined by an{" "}
          <Link href="/help/medals-faq/#h-indexes">h-index</Link> to reward a
          balance of both the # of questions and their engagement. Learn more{" "}
          <Link href="/help/medals-faq/#question-writing-medals">here</Link>.
        </span>
        {ProForecastersInfo}
      </>
    ),
  },
  tournament: {
    id: "tournament",
    translationKey: "tournaments",
    shortTranslationKey: "all",
    explanation: null,
  },
};
