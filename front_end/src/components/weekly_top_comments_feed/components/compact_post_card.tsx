"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ConsumerQuestionTile from "@/components/consumer_post_card/consumer_question_tile";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import MultipleChoiceTileLegend from "@/components/post_card/multiple_choice_tile/multiple_choice_tile_legend";
import HideCPProvider from "@/contexts/cp_context";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import {
  generateChoiceItemsFromGroupQuestions,
  generateChoiceItemsFromMultipleChoiceForecast,
} from "@/utils/questions/choices";
import {
  isContinuousQuestionType,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isNotebookPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

const VISIBLE_CHOICES_COUNT = 3;

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const CompactPostCard: FC<Props> = ({ post, className }) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div
      className={cn(
        "relative flex min-h-[280px] flex-col gap-4 p-6 no-underline",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={0}
          url={getPostLink(post)}
          variant="gray"
          className="pl-0 md:pl-0"
        />
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          className="px-0 md:px-0"
        />
      </div>

      <h4 className="m-0 text-base font-medium leading-5 text-gray-800 no-underline dark:text-gray-800-dark">
        {post.title}
      </h4>

      <HideCPProvider post={post}>
        <div className="my-auto flex flex-col">
          <PostPreview post={post} t={t} locale={locale} />
        </div>
      </HideCPProvider>
      <Link
        href={getPostLink(post)}
        className="absolute left-0 top-0 z-100 h-full w-full @container"
      />
    </div>
  );
};

const PostPreview: FC<{
  post: PostWithForecasts;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}> = ({ post, t, locale }) => {
  if (isQuestionPost(post) && !isMultipleChoicePost(post)) {
    const isNumeric = isContinuousQuestionType(post.question.type);
    return (
      <div
        className="self-center"
        // A small workaround to avoid jumping of content during posts load
        style={isNumeric ? { zoom: 0.9 } : undefined}
      >
        <ConsumerQuestionTile question={post.question} />
      </div>
    );
  }

  if (isMultipleChoicePost(post)) {
    const choices = generateChoiceItemsFromMultipleChoiceForecast(
      post.question,
      t
    );
    return (
      <MultipleChoiceTileLegend
        choices={choices}
        visibleChoicesCount={VISIBLE_CHOICES_COUNT}
        questionType={post.question.type}
        layout="wrap"
        optionLabelClassName="flex-none pr-1.5 -ml-1"
        optionValueClassName="text-gray-600 dark:text-gray-600-dark font-normal"
      />
    );
  }

  if (isGroupOfQuestionsPost(post)) {
    // TODO: same as multiple choice
    const choices = generateChoiceItemsFromGroupQuestions(
      post.group_of_questions,
      {
        activeCount: VISIBLE_CHOICES_COUNT,
        locale,
        excludeUnit: true,
      }
    );
    return (
      <MultipleChoiceTileLegend
        choices={choices}
        visibleChoicesCount={VISIBLE_CHOICES_COUNT}
        questionType={post.group_of_questions.questions.at(0)?.type}
        layout="wrap"
        optionLabelClassName="flex-none pr-1.5"
        optionValueClassName="text-gray-600 dark:text-gray-600-dark font-normal"
      />
    );
  }

  if (isNotebookPost(post) && post.notebook.image_url) {
    return (
      <img
        src={post.notebook.image_url}
        alt=""
        className="h-[110px] w-full rounded object-cover"
      />
    );
  }

  return null;
};

export default CompactPostCard;
