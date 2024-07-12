import { ReactNode } from "react";

import { CategoryKey } from "@/types/scoring";

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
      <span>
        <a href="/help/medals-faq/">Learn more</a> about Metaculus Medals
      </span>
    ),
  },
  baseline: {
    id: "baseline",
    translationKey: "baselineAccuracy",
    shortTranslationKey: "baselineAccuracyShort",
    explanation: (
      <span>
        <strong>Baseline Accuracy</strong> measures how accurate a user was
        compared to chance. User scores are determined by summing their{" "}
        <a href="/help/scores-faq/#baseline-score">Baseline scores</a> for all
        questions within a time period. This category rewards forecasters who
        are both accurate and forecast on many questions. Learn more{" "}
        <a href="/help/medals-faq/#baseline-medals">here</a>.
      </span>
    ),
  },
  peer: {
    id: "peer",
    translationKey: "peerAccuracy",
    shortTranslationKey: "peerAccuracyShort",
    explanation: (
      <span>
        <strong>Peer Accuracy</strong> measures how accurate a user was compared
        to others. Users are ranked by the average of their{" "}
        <a href="/help/scores-faq/#peer-score">Peer scores</a>. If a user
        forecast
        {" N<40"} questions, then their average score includes (40-N) questions
        with a 0 score. This lowers the chance of a user getting lucky on a few
        questions and winning a medal. Learn more{" "}
        <a href="/help/medals-faq/#peer-medals">here</a>.
      </span>
    ),
  },
  comments: {
    id: "comments",
    translationKey: "comments",
    shortTranslationKey: "comments",
    explanation: (
      <span>
        The <strong>Comments</strong> category rewards writing insightful
        comments determined by the number of upvotes. Medals are awarded
        annually with rankings determined by an{" "}
        <a href="/help/medals-faq/#h-indexes">h-index</a> to reward a balance of
        both the # of comments and their quality. Learn more{" "}
        <a href="/help/medals-faq/#comments-medals">here</a>.
      </span>
    ),
  },
  questionWriting: {
    id: "questionWriting",
    translationKey: "questionWriting",
    shortTranslationKey: "questionWritingShort",
    explanation: (
      <span>
        The <strong>Question Writing</strong> category rewards authoring
        engaging questions as determined by the number of forecasters divided by
        ten. Medals are awarded annually with rankings determined by an{" "}
        <a href="/help/medals-faq/#h-indexes">h-index</a> to reward a balance of
        both the # of questions and their engagement. Learn more{" "}
        <a href="/help/medals-faq/#question-writing-medals">here</a>.
      </span>
    ),
  },
  tournament: {
    id: "tournament",
    translationKey: "tournament",
    shortTranslationKey: "all",
    explanation: null,
  },
};
