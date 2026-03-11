import {
  faChartArea,
  faChartLine,
  faChartSimple,
  faChartBar,
  faGauge,
  faTable,
} from "@fortawesome/free-solid-svg-icons";
import { Suspense } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { BasicQuestionContent } from "./basic-question";
import { FlippableQuestionCard } from "./flippable-question-card";
import { QuestionCard, QuestionCardSkeleton } from "./question-card";

function getLeftIcon(postData: PostWithForecasts, subQuestionId?: number) {
  if (isMultipleChoicePost(postData) && !subQuestionId) {
    return faChartBar;
  }

  if (isGroupOfQuestionsPost(postData) && !subQuestionId) {
    const questionType = postData.group_of_questions?.questions[0]?.type;
    if (questionType === QuestionType.Binary) {
      return faChartBar;
    }
    if (
      questionType === QuestionType.Numeric &&
      postData.group_of_questions?.graph_type ===
        GroupOfQuestionsGraphType.FanGraph
    ) {
      return faChartSimple;
    }
    return faTable;
  }

  const question = subQuestionId
    ? postData.group_of_questions?.questions.find((q) => q.id === subQuestionId)
    : postData.question;

  if ((isQuestionPost(postData) || subQuestionId) && question) {
    switch (question.type) {
      case QuestionType.Binary:
        return faGauge;
      case QuestionType.Numeric:
      case QuestionType.Discrete:
      case QuestionType.Date:
        return faChartArea;
    }
  }

  return faTable;
}

function getRightIcon(postData: PostWithForecasts, subQuestionId?: number) {
  if (isMultipleChoicePost(postData) && !subQuestionId) {
    return faChartArea;
  }
  return faChartLine;
}

type QuestionLoaderProps = {
  questionId: number;
  preferTimeline?: boolean;
  subQuestionId?: number;
  variant?: "primary" | "secondary";
  title?: string;
  subtitle?: string;
  className?: string;
};

/**
 * Async server component that fetches post data
 */
async function QuestionContent({
  questionId,
  preferTimeline,
  subQuestionId,
  variant,
  title,
  subtitle,
  className,
}: QuestionLoaderProps) {
  const postData = await ServerPostsApi.getPost(questionId, true);
  const isFlippable = preferTimeline === undefined;
  const subQuestionData = subQuestionId
    ? postData.group_of_questions?.questions.find(
        (question) => question.id === subQuestionId
      )
    : undefined;

  if (isFlippable) {
    return (
      <FlippableQuestionCard
        leftContent={
          <BasicQuestionContent
            postData={postData}
            subQuestionId={subQuestionId}
            preferTimeline={false}
          />
        }
        rightContent={
          <BasicQuestionContent
            postData={postData}
            subQuestionId={subQuestionId}
            preferTimeline={true}
          />
        }
        leftIcon={getLeftIcon(postData, subQuestionId)}
        rightIcon={getRightIcon(postData, subQuestionId)}
        title={title || subQuestionData?.title || postData.title}
        subtitle={subtitle}
        variant={variant}
        className={className}
        postIds={[postData.id]}
      />
    );
  }

  return (
    <QuestionCard
      title={title || subQuestionData?.title || postData.title}
      subtitle={subtitle}
      variant={variant}
      className={className}
      postIds={[postData.id]}
    >
      <BasicQuestionContent
        postData={postData}
        preferTimeline={preferTimeline}
        subQuestionId={subQuestionId}
      />
    </QuestionCard>
  );
}

/**
 * Server-side question loader with Suspense for async data fetching.
 * Uses ServerPostsApi.getPost to fetch post data on the server.
 */
export function QuestionLoader({
  questionId,
  subQuestionId,
  preferTimeline,
  variant = "secondary",
  title,
  subtitle,
  className,
}: QuestionLoaderProps) {
  return (
    <Suspense
      fallback={
        <QuestionCardSkeleton variant={variant} className={className} />
      }
    >
      <QuestionContent
        questionId={questionId}
        subQuestionId={subQuestionId}
        preferTimeline={preferTimeline}
        variant={variant}
        title={title}
        subtitle={subtitle}
        className={className}
      />
    </Suspense>
  );
}
