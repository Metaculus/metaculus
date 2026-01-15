import { Suspense } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";

import { BasicQuestionContent } from "./basic-question";
import { FlippableQuestionCard } from "./flippable-question-card";
import { QuestionCard, QuestionCardSkeleton } from "./question-card";

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
        title={title || subQuestionData?.title || postData.title}
        subtitle={subtitle}
        variant={variant}
        className={className}
      />
    );
  }

  return (
    <QuestionCard
      title={title || subQuestionData?.title || postData.title}
      subtitle={subtitle}
      variant={variant}
      className={className}
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
