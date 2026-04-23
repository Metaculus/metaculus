"use client";

import { useTranslations } from "next-intl";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import KeyFactorsQuestionConsumerSection from "@/app/(main)/questions/[id]/components/key_factors/key_factors_question_consumer_section";
import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import MetaRow from "@/app/(main)/questions/[id]/components/question_page_shell/meta_row";
import TitleRow from "@/app/(main)/questions/[id]/components/question_page_shell/title_row";
import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import {
  GroupOfQuestionsGraphType,
  PostStatus,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
} from "@/utils/questions/helpers";

import ActionRow from "../action_row";
import ConsumerQuestionPrediction from "./prediction";
import { isDisplayableQuestionLink } from "../../key_factors/utils";

type Props = {
  postData: PostWithForecasts;
};

const ConsumerQuestionView: React.FC<Props> = ({ postData }) => {
  const t = useTranslations();
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();

  const isFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;

  const isDateGroup =
    postData.group_of_questions &&
    checkGroupOfQuestionsPostType(postData, QuestionType.Date);

  const reverseOrder =
    (isMultipleChoicePost(postData) || isGroupOfQuestionsPost(postData)) &&
    !isDateGroup;

  const showClosedMessageMultipleChoice =
    isMultipleChoicePost(postData) &&
    postData.question.status === QuestionStatus.CLOSED;

  const showClosedMessageFanGraph =
    isFanGraph && postData.status === PostStatus.CLOSED;

  const questionLinkAggregates =
    aggregateCoherenceLinks?.data.filter(isDisplayableQuestionLink) ?? [];

  const hasKeyFactors = (postData.key_factors?.length ?? 0) > 0;
  const hasQuestionLinks = questionLinkAggregates.length > 0;

  const shouldShowKeyFactorsSection = hasKeyFactors || hasQuestionLinks;

  return (
    <div className="flex flex-col">
      <PostStatusBox post={postData} className="mb-5 rounded lg:mb-6" />
      <div className="mb-6 flex items-center justify-center gap-[6px] md:hidden">
        <CommentStatus
          totalCount={postData.comment_count ?? 0}
          unreadCount={postData.unread_comment_count ?? 0}
          url={getPostLink(postData)}
          className="bg-gray-200 px-2 dark:bg-gray-200-dark"
        />
        <ForecastersCounter
          forecasters={postData.nr_forecasters}
          compact={false}
        />
      </div>

      <MetaRow post={postData} className="-mx-4 mb-2 hidden md:flex lg:-mx-8" />
      <TitleRow post={postData} variant="consumer" />

      <div className="flex justify-center">
        <ActionRow post={postData} variant="consumer" />
      </div>

      <div className="mt-6 sm:mt-8">
        {showClosedMessageMultipleChoice && (
          <p className="m-0 mb-8 text-center text-sm leading-[20px] text-gray-700 dark:text-gray-700-dark">
            {t("predictionClosedMessage")}
          </p>
        )}

        <div
          className={cn("flex flex-col", reverseOrder && "flex-col-reverse")}
        >
          <ConsumerQuestionPrediction postData={postData} />

          {showClosedMessageFanGraph && (
            <p className="my-8 text-center text-sm leading-[20px] text-gray-700 dark:text-gray-700-dark">
              {t("predictionClosedMessage")}
            </p>
          )}
        </div>

        {shouldShowKeyFactorsSection && (
          <KeyFactorsQuestionConsumerSection post={postData} />
        )}
      </div>
    </div>
  );
};

export default ConsumerQuestionView;
