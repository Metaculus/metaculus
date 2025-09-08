"use client";

import { useLocale } from "next-intl";
import { FC, useEffect } from "react";

import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import QuestionHeaderInfo from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_info";
import ConditionalTile from "@/components/conditional_tile";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  isContinuousQuestion,
  isConditionalPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import QuestionHeaderCPStatus from "./question_header_cp_status";
import QuestionTitle from "../../shared/question_title";

const QuestionHeader: FC<{ post: PostWithForecasts }> = ({ post }) => {
  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const locale = useLocale();

  useEffect(() => {
    if (post.is_current_content_translated) {
      setTimeout(() => {
        setBannerIsVisible(true);
      }, 0);
    }
  }, [post, locale, setBannerIsVisible]);

  return (
    <div>
      <div className="flex flex-col">
        <PostStatusBox post={post} className="mb-5 rounded lg:mb-6" />
      </div>
      <div className="flex w-full items-stretch justify-between gap-2 xs:gap-4 sm:gap-8">
        <div className="flex flex-1 flex-col gap-4">
          {isConditionalPost(post) ? (
            <ConditionalTile post={post} withNavigation withCPRevealBtn />
          ) : (
            <div className="lg:order-0 order-1 flex items-center">
              <QuestionTitle>{post.title}</QuestionTitle>
              {isQuestionPost(post) && (
                <div className="md:hidden">
                  <QuestionHeaderCPStatus
                    question={post.question as QuestionWithForecasts}
                    size="md"
                    hideLabel={isContinuousQuestion(post.question)}
                  />
                </div>
              )}
            </div>
          )}
          <QuestionHeaderInfo post={post} className="order-0 lg:order-1" />
        </div>
        {isQuestionPost(post) && !isContinuousQuestion(post.question) && (
          <div className="hidden md:block">
            <QuestionHeaderCPStatus
              question={post.question as QuestionWithForecasts}
              size="lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionHeader;
