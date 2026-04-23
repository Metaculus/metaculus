"use client";

import { FC } from "react";

import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import QuestionTitle from "@/app/(main)/questions/[id]/components/question_view/shared/question_title";
import ConditionalTile from "@/components/conditional_tile";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  isConditionalPost,
  isContinuousQuestion,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Variant = "forecaster" | "consumer";

type Props = {
  post: PostWithForecasts;
  variant: Variant;
};

const TitleRow: FC<Props> = ({ post, variant }) => {
  if (isConditionalPost(post)) {
    return <ConditionalTile post={post} withNavigation withCPRevealBtn />;
  }

  if (variant === "forecaster" && isQuestionPost(post)) {
    return (
      <div className="flex w-full items-stretch justify-between gap-2 xs:gap-4 sm:gap-8">
        <div className="flex flex-1 flex-col">
          <div className="lg:order-0 order-1 flex items-center">
            <QuestionTitle className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {post.title}
            </QuestionTitle>
            <div className="md:hidden">
              <QuestionHeaderCPStatus
                question={post.question as QuestionWithForecasts}
                size="md"
                hideLabel={isContinuousQuestion(post.question)}
              />
            </div>
          </div>
        </div>
        {!isContinuousQuestion(post.question) && (
          <div className="hidden md:block">
            <QuestionHeaderCPStatus
              question={post.question as QuestionWithForecasts}
              size="lg"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <QuestionTitle className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
      {post.title}
    </QuestionTitle>
  );
};

export default TitleRow;
