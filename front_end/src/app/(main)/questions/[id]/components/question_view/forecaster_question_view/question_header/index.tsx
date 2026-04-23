"use client";

import { useLocale } from "next-intl";
import { FC, useEffect } from "react";

import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import MetaRow from "@/app/(main)/questions/[id]/components/question_page_shell/meta_row";
import TitleRow from "@/app/(main)/questions/[id]/components/question_page_shell/title_row";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  isContinuousQuestion,
  isConditionalPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import QuestionHeaderCPStatus from "./question_header_cp_status";
import ActionRow from "../../action_row";
import QuestionTitle from "../../shared/question_title";

import ActionRow from "../../action_row";

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
      <div className="flex flex-1 flex-col gap-4">
        <MetaRow post={post} className="-mx-4 mb-2 hidden md:flex lg:-mx-8" />
        <TitleRow
          post={post}
          variant="forecaster"
          className="lg:order-0 order-1"
        />
      </div>
      <ActionRow post={post} variant="forecaster" />
    </div>
  );
};

export default QuestionHeader;
