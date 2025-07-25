"use client";

import { useLocale } from "next-intl";
import { FC, useEffect } from "react";

import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_header_cp_status";
import QuestionHeaderInfo from "@/app/(main)/questions/[id]/components/question_header_info";
import ConditionalTile from "@/components/conditional_tile";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { PostWithForecasts } from "@/types/post";
import { isConditionalPost, isQuestionPost } from "@/utils/questions/helpers";

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
      <div className="flex items-stretch justify-between gap-2 xs:gap-4 sm:gap-8">
        <div className="flex flex-col gap-4">
          {isConditionalPost(post) ? (
            <ConditionalTile post={post} withNavigation withCPRevealBtn />
          ) : (
            <div className="lg:order-0 order-1 flex items-center">
              <h1 className="m-0 pr-4 text-xl leading-tight text-blue-800 dark:text-blue-800-dark lg:pr-0 lg:text-3xl">
                {post.title}
              </h1>
              <div className="lg:hidden">
                <QuestionHeaderCPStatus post={post} size="sm" />
              </div>
            </div>
          )}
          <QuestionHeaderInfo post={post} className="order-0 lg:order-1" />
        </div>
        {isQuestionPost(post) && (
          <div className="hidden lg:block">
            <QuestionHeaderCPStatus post={post} size="lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionHeader;
