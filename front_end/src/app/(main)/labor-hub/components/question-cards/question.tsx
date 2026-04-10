import {
  faChartArea,
  faChartLine,
  faChartSimple,
  faChartBar,
  faGauge,
  faTable,
} from "@fortawesome/free-solid-svg-icons";
import { ReactNode, Suspense } from "react";

import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
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
import { NoQuestionPlaceholder } from "./placeholder";
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
  note?: ReactNode;
  isFlippable?: boolean;
  preferTimeline?: boolean;
  subQuestionId?: number;
  variant?: "primary" | "secondary";
  title?: string;
  subtitle?: string;
  fallbackTitle?: string;
  className?: string;
  timelineMarkers?: GroupTimelineMarker[];
};

/**
 * Async server component that fetches post data
 */
async function QuestionContent({
  questionId,
  note,
  preferTimeline,
  isFlippable = true,
  subQuestionId,
  variant,
  title,
  subtitle,
  fallbackTitle,
  className,
  timelineMarkers,
}: QuestionLoaderProps) {
  let postData;
  try {
    postData = await ServerPostsApi.getPost(questionId, true);
  } catch {
    return (
      <QuestionCard
        title={title || fallbackTitle}
        subtitle={subtitle}
        variant={variant}
        className={className}
        postIds={[questionId]}
      >
        <NoQuestionPlaceholder />
      </QuestionCard>
    );
  }
  const subQuestionData = subQuestionId
    ? postData.group_of_questions?.questions.find(
        (question) => question.id === subQuestionId
      )
    : undefined;

  if (isFlippable) {
    return (
      <>
        <FlippableQuestionCard
          leftContent={
            <BasicQuestionContent
              postData={postData}
              subQuestionId={subQuestionId}
              preferTimeline={false}
              timelineMarkers={timelineMarkers}
            />
          }
          rightContent={
            <BasicQuestionContent
              postData={postData}
              subQuestionId={subQuestionId}
              preferTimeline={true}
              timelineMarkers={timelineMarkers}
            />
          }
          leftIcon={getLeftIcon(postData, subQuestionId)}
          rightIcon={getRightIcon(postData, subQuestionId)}
          title={title || subQuestionData?.title || postData.title}
          subtitle={subtitle}
          variant={variant}
          className={className}
          postIds={[postData.id]}
          defaultSide={preferTimeline ? "right" : "left"}
        />
        {note && (
          <div className="!mt-2 text-sm text-blue-700 dark:text-blue-700-dark">
            {note}
          </div>
        )}
      </>
    );
  }

  return (
    <>
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
          timelineMarkers={timelineMarkers}
        />
      </QuestionCard>
      {note && (
        <div className="!mt-2 text-sm text-blue-700 dark:text-blue-700-dark">
          {note}
        </div>
      )}
    </>
  );
}

/**
 * Server-side question loader with Suspense for async data fetching.
 * Uses ServerPostsApi.getPost to fetch post data on the server.
 */
export function QuestionLoader({
  questionId,
  note,
  isFlippable,
  subQuestionId,
  preferTimeline,
  variant = "secondary",
  title,
  subtitle,
  fallbackTitle,
  className,
  timelineMarkers,
}: QuestionLoaderProps) {
  return (
    <Suspense
      fallback={
        <QuestionCardSkeleton variant={variant} className={className} />
      }
    >
      <QuestionContent
        questionId={questionId}
        isFlippable={isFlippable}
        subQuestionId={subQuestionId}
        preferTimeline={preferTimeline}
        variant={variant}
        title={title}
        subtitle={subtitle}
        fallbackTitle={fallbackTitle}
        note={note}
        className={className}
        timelineMarkers={timelineMarkers}
      />
    </Suspense>
  );
}
