"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, Fragment, ReactNode, useEffect } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import {
  GroupOfQuestionsGraphType,
  PostStatus,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import MetaRow from "./meta_row";
import QuestionPageShellTabs from "./tabs";
import TitleRow from "./title_row";
import KeyFactorsQuestionConsumerSection from "../key_factors/key_factors_question_consumer_section";
import { isDisplayableQuestionLink } from "../key_factors/utils";
import { QuestionLayoutProvider } from "../question_layout/question_layout_context";
import { QuestionVariantComposer } from "../question_variant_composer";
import ActionRow from "../question_view/action_row";
import ConsumerQuestionPrediction from "../question_view/consumer_question_view/prediction";
import QuestionTimeline from "../question_view/consumer_question_view/timeline";

const sectionClassName =
  "relative z-10 flex w-[59rem] max-w-full flex-col gap-5 overflow-x-clip rounded border-transparent bg-gray-0 p-4 text-gray-900 dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark lg:gap-6 lg:border lg:p-8";

type ShellProps = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId?: number;
};

export const ForecasterShell: FC<
  ShellProps & { mobileSidebar?: ReactNode }
> = ({ postData, preselectedGroupQuestionId, mobileSidebar }) => {
  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const locale = useLocale();

  useEffect(() => {
    if (postData.is_current_content_translated) {
      setTimeout(() => {
        setBannerIsVisible(true);
      }, 0);
    }
  }, [postData, locale, setBannerIsVisible]);

  const isResolved = postData.status === PostStatus.RESOLVED;
  const isGroup = isGroupOfQuestionsPost(postData);

  return (
    <Fragment>
      <section className={sectionClassName}>
        <PostStatusBox post={postData} className="mb-5 rounded lg:mb-6" />
        {postData.projects?.default_project && (
          <CommunityDisclaimer
            project={postData.projects.default_project}
            variant="standalone"
            className="block sm:hidden"
          />
        )}
        <div className="flex flex-col gap-4">
          <MetaRow
            post={postData}
            variant="forecaster"
            className="-mx-4 mb-2 lg:-mx-8"
          />
          <TitleRow
            post={postData}
            variant="forecaster"
            className="lg:order-0 order-1"
          />
        </div>
        <ActionRow post={postData} variant="forecaster" />
        <div className="md:-mt-2 lg:-mt-3">
          {isQuestionPost(postData) && (
            <DetailedQuestionCard
              post={postData}
              keyFactors={postData.key_factors}
              hideTitle
            />
          )}
          {isGroup && (
            <DetailedGroupCard
              post={postData}
              preselectedQuestionId={preselectedGroupQuestionId}
            />
          )}
        </div>
        {(!isResolved || isGroup) && <ForecastMaker post={postData} />}
        <QuestionPageShellTabs post={postData} variant="forecaster" />
      </section>
      {mobileSidebar}
    </Fragment>
  );
};

export const ConsumerShell: FC<{ postData: PostWithForecasts }> = ({
  postData,
}) => {
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
    <section className={sectionClassName}>
      <PostStatusBox post={postData} className="mb-5 rounded lg:mb-6" />
      {postData.projects?.default_project && (
        <CommunityDisclaimer
          project={postData.projects.default_project}
          variant="standalone"
          className="block sm:hidden"
        />
      )}
      <MetaRow
        post={postData}
        variant="consumer"
        className="-mx-4 mb-2 lg:-mx-8"
      />
      <TitleRow post={postData} variant="consumer" />
      <div className="order-2 md:order-none">
        <ActionRow post={postData} variant="consumer" />
      </div>
      <div className="order-1 mt-6 sm:mt-8 md:order-none md:-mt-2 lg:-mt-3">
        {showClosedMessageMultipleChoice && (
          <p className="m-0 mb-8 text-center text-sm leading-[20px] text-gray-700 dark:text-gray-700-dark">
            {t("predictionClosedMessage")}
          </p>
        )}
        <div
          className={cn(
            "flex flex-col",
            reverseOrder && "flex-col-reverse",
            !reverseOrder && "sm:flex-row sm:items-center sm:gap-8"
          )}
        >
          <ConsumerQuestionPrediction postData={postData} />
          {!isFanGraph && (
            <QuestionTimeline
              postData={postData}
              keyFactors={postData.key_factors}
              hideTitle
              className={!reverseOrder ? "mt-0 flex-1" : undefined}
            />
          )}
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
      <QuestionPageShellTabs post={postData} variant="consumer" />
    </section>
  );
};

type Props = {
  postData: PostWithForecasts;
  preselectedGroupQuestionId?: number;
  mobileSidebar?: ReactNode;
};

const QuestionPageShell: FC<Props> = ({
  postData,
  preselectedGroupQuestionId,
  mobileSidebar,
}) => {
  return (
    <QuestionLayoutProvider>
      <QuestionVariantComposer
        consumer={<ConsumerShell postData={postData} />}
        forecaster={
          <ForecasterShell
            postData={postData}
            preselectedGroupQuestionId={preselectedGroupQuestionId}
            mobileSidebar={mobileSidebar}
          />
        }
      />
    </QuestionLayoutProvider>
  );
};

export default QuestionPageShell;
