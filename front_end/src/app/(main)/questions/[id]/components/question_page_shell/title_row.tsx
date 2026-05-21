"use client";

import { FC } from "react";

import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import QuestionTitle from "@/app/(main)/questions/[id]/components/question_view/shared/question_title";
import RevealCPButton from "@/app/(main)/questions/[id]/components/reveal_cp_button";
import ConditionalTile from "@/components/conditional_tile";
import { useContinuousChartCursor } from "@/contexts/continuous_chart_cursor_context";
import { useHideCP } from "@/contexts/cp_context";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  isConditionalPost,
  isContinuousQuestion,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Variant = "forecaster" | "consumer";

type Props = {
  post: PostWithForecasts;
  variant: Variant;
  className?: string;
};

const TitleRow: FC<Props> = ({ post, variant, className }) => {
  const { hideCP } = useHideCP();
  const cursorCtx = useContinuousChartCursor();
  const cursorForecast = cursorCtx?.activeForecast ?? null;
  const cursorUserForecastValues = cursorCtx?.activeUserForecastValues ?? null;

  if (isConditionalPost(post)) {
    return (
      <div className={className}>
        <ConditionalTile post={post} withNavigation withCPRevealBtn />
      </div>
    );
  }

  if (variant === "forecaster" && isQuestionPost(post)) {
    const isMultipleChoice = post.question.type === QuestionType.MultipleChoice;
    const isContinuous = isContinuousQuestion(post.question);

    return (
      <div
        className={cn(
          "flex w-full items-stretch justify-between gap-2 xs:gap-4 sm:gap-8",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "lg:order-0 order-1 flex gap-2",
              hideCP ? "flex-col" : "items-center"
            )}
          >
            <QuestionTitle className="min-w-0 break-words text-xl font-bold leading-tight tracking-[-0.4px] text-blue-800 dark:text-blue-800-dark sm:text-3xl sm:tracking-tight lg:text-4xl">
              {post.title}
            </QuestionTitle>
            <div className="shrink-0 self-center md:hidden">
              {isMultipleChoice ? (
                hideCP && <RevealCPButton className="whitespace-nowrap" />
              ) : (
                <QuestionHeaderCPStatus
                  question={post.question as QuestionWithForecasts}
                  size="md"
                  hideLabel={isContinuous}
                  cursorForecast={isContinuous ? cursorForecast : undefined}
                  cursorUserForecastValues={
                    isContinuous ? cursorUserForecastValues : undefined
                  }
                />
              )}
            </div>
          </div>
        </div>
        {!isContinuous && (
          <div className="hidden shrink-0 md:block">
            {isMultipleChoice && hideCP ? (
              <RevealCPButton className="whitespace-nowrap" />
            ) : (
              <QuestionHeaderCPStatus
                question={post.question as QuestionWithForecasts}
                size="lg"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === "forecaster" && isGroupOfQuestionsPost(post)) {
    return (
      <div
        className={cn(
          "flex w-full items-stretch justify-between gap-2 xs:gap-4 sm:gap-8",
          className
        )}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className={cn(
              "lg:order-0 order-1 flex gap-2",
              hideCP ? "flex-col" : "items-center"
            )}
          >
            <QuestionTitle className="min-w-0 break-words text-xl font-bold leading-tight tracking-[-0.4px] text-blue-800 dark:text-blue-800-dark sm:text-3xl sm:tracking-tight lg:text-4xl">
              {post.title}
            </QuestionTitle>
            {hideCP && (
              <div className="shrink-0 self-center md:hidden">
                <RevealCPButton className="whitespace-nowrap" />
              </div>
            )}
          </div>
        </div>
        {hideCP && (
          <div className="hidden shrink-0 md:block">
            <RevealCPButton className="whitespace-nowrap" />
          </div>
        )}
      </div>
    );
  }

  return (
    <QuestionTitle
      className={cn(
        "text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl",
        variant === "consumer" && "pr-0 text-center md:text-left",
        className
      )}
    >
      {post.title}
    </QuestionTitle>
  );
};

export default TitleRow;
