"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, Fragment, ReactNode, useEffect } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import UpcomingCP from "@/components/consumer_post_card/upcoming_cp";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import { ContinuousChartCursorProvider } from "@/contexts/continuous_chart_cursor_context";
import { useHideCP } from "@/contexts/cp_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import {
  GroupOfQuestionsGraphType,
  PostStatus,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { TournamentType } from "@/types/projects";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import {
  checkGroupOfQuestionsPostType,
  isContinuousQuestion,
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import MetaRow from "./meta_row";
import QuestionPageShellTabs from "./tabs";
import TitleRow from "./title_row";
import KeyFactorsQuestionConsumerSection from "../key_factors/key_factors_question_consumer_section";
import { isDisplayableQuestionLink } from "../key_factors/utils";
import PostScoreData from "../post_score_data";
import { QuestionLayoutProvider } from "../question_layout/question_layout_context";
import { QuestionVariantComposer } from "../question_variant_composer";
import ActionRow from "../question_view/action_row";
import ConsumerQuestionPrediction from "../question_view/consumer_question_view/prediction";
import QuestionTimeline from "../question_view/consumer_question_view/timeline";
import QuestionHeaderCPStatus from "../question_view/forecaster_question_view/question_header/question_header_cp_status";
import RevealCPButton from "../reveal_cp_button";

const baseSectionClassName =
  "relative z-10 flex w-[59rem] max-w-full flex-col gap-6 overflow-x-clip rounded border border-blue-400 p-4 text-gray-900 dark:border-blue-200-dark dark:text-gray-900-dark lg:p-8";

const mainSectionClassName = `${baseSectionClassName} bg-gray-0 dark:bg-gray-0-dark`;
const commentSectionClassName = `${baseSectionClassName} bg-blue-100 dark:bg-gray-0-dark`;

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
    const timeoutId = window.setTimeout(() => {
      setBannerIsVisible(Boolean(postData.is_current_content_translated));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [postData.is_current_content_translated, locale, setBannerIsVisible]);

  const isResolved = postData.status === PostStatus.RESOLVED;
  const isGroup = isGroupOfQuestionsPost(postData);

  return (
    <Fragment>
      <div className="flex flex-col gap-1.5 md:gap-4">
        <section className={mainSectionClassName}>
          <PostStatusBox post={postData} className="mb-5 rounded lg:mb-6" />
          {postData.projects?.default_project?.type ===
            TournamentType.Community && (
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
          <div className="-mt-2 lg:-mt-3">
            {isQuestionPost(postData) && (
              <DetailedQuestionCard
                post={postData}
                keyFactors={postData.key_factors}
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
          <PostScoreData post={postData} noSectionWrapper />
        </section>
        <section className={commentSectionClassName}>
          <QuestionPageShellTabs post={postData} variant="forecaster" />
        </section>
      </div>
      {mobileSidebar}
    </Fragment>
  );
};

export const ConsumerShell: FC<{
  postData: PostWithForecasts;
  preselectedGroupQuestionId?: number;
  mobileSidebar?: ReactNode;
}> = ({ postData, preselectedGroupQuestionId, mobileSidebar }) => {
  const t = useTranslations();
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();
  const { hideCP } = useHideCP();

  const isFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;

  const isDateGroup =
    postData.group_of_questions &&
    checkGroupOfQuestionsPostType(postData, QuestionType.Date);

  const isMultipleChoice = isMultipleChoicePost(postData);
  const isNonFanGroup = isGroupOfQuestionsPost(postData) && !isFanGraph;

  const reverseOrder =
    (isMultipleChoice || isGroupOfQuestionsPost(postData)) && !isDateGroup;

  const isContinuousSingleQuestion =
    isQuestionPost(postData) && isContinuousQuestion(postData.question);

  const isBinarySingleQuestion =
    isQuestionPost(postData) &&
    !isContinuousSingleQuestion &&
    !isMultipleChoice;

  const binaryForecastAvailability =
    isBinarySingleQuestion && isQuestionPost(postData)
      ? getQuestionForecastAvailability(postData.question)
      : null;

  const showSideBySide =
    isMultipleChoice ||
    isNonFanGroup ||
    isBinarySingleQuestion ||
    isContinuousSingleQuestion;

  const showClosedMessageMultipleChoice =
    isMultipleChoicePost(postData) &&
    postData.question.status === QuestionStatus.CLOSED;

  const showClosedMessageFanGraph =
    isFanGraph && postData.status === PostStatus.CLOSED;

  const questionLinkAggregates =
    aggregateCoherenceLinks?.data.filter(isDisplayableQuestionLink) ?? [];
  const hasKeyFactors = (postData.key_factors?.length ?? 0) > 0;
  const hasQuestionLinks = questionLinkAggregates.length > 0;
  const questionForecastAvailability = isQuestionPost(postData)
    ? getQuestionForecastAvailability(postData.question)
    : null;
  const isForecastEmpty =
    !!questionForecastAvailability?.isEmpty &&
    !questionForecastAvailability?.cpRevealsOn;
  const shouldShowKeyFactorsSection =
    hasKeyFactors || hasQuestionLinks || isForecastEmpty;

  return (
    <div className="flex flex-col gap-1.5 md:gap-4">
      <section className={mainSectionClassName}>
        <PostStatusBox post={postData} className="mb-5 rounded lg:mb-6" />
        {postData.projects?.default_project?.type ===
          TournamentType.Community && (
          <CommunityDisclaimer
            project={postData.projects.default_project}
            variant="standalone"
            className="block sm:hidden"
          />
        )}
        <div className="flex flex-col gap-4">
          <MetaRow
            post={postData}
            variant="consumer"
            className="-mx-4 mb-2 lg:-mx-8"
          />
          <TitleRow post={postData} variant="consumer" />
        </div>
        <div className="order-2 sm:order-none">
          <ActionRow post={postData} variant="consumer" />
        </div>
        <div className="order-1 mt-3 sm:order-none sm:mt-0 md:-mt-2 lg:-mt-3">
          {showClosedMessageMultipleChoice && (
            <p className="m-0 mb-8 text-center text-sm leading-[20px] text-gray-700 dark:text-gray-700-dark">
              {t("predictionClosedMessage")}
            </p>
          )}
          <div
            className={cn(
              "flex flex-col",
              reverseOrder &&
                !isMultipleChoice &&
                !isNonFanGroup &&
                "flex-col-reverse",
              showSideBySide &&
                cn("sm:flex-row sm:items-center", {
                  "sm:gap-0 md:gap-8": isBinarySingleQuestion,
                  "sm:gap-8": !isBinarySingleQuestion,
                })
            )}
          >
            {isBinarySingleQuestion && isQuestionPost(postData) ? (
              <div className="order-1 flex w-64 flex-col items-center justify-center gap-[18px] self-center sm:self-stretch">
                {hideCP ? (
                  <RevealCPButton />
                ) : binaryForecastAvailability?.cpRevealsOn ? (
                  <UpcomingCP
                    cpRevealsOn={binaryForecastAvailability.cpRevealsOn}
                  />
                ) : (
                  <QuestionHeaderCPStatus
                    question={postData.question}
                    size="lg"
                  />
                )}
              </div>
            ) : (
              <div
                className={cn(
                  showSideBySide && !isDateGroup ? "order-1" : undefined,
                  isContinuousSingleQuestion && "md:hidden",
                  showSideBySide &&
                    !isDateGroup &&
                    !isContinuousSingleQuestion &&
                    "sm:max-w-[200px]",
                  hideCP &&
                    !isContinuousSingleQuestion &&
                    (isDateGroup || isFanGraph) &&
                    "flex w-full justify-center"
                )}
              >
                {hideCP && !isContinuousSingleQuestion ? (
                  <RevealCPButton />
                ) : (
                  <ConsumerQuestionPrediction postData={postData} />
                )}
              </div>
            )}
            {!isFanGraph && !isDateGroup && (
              <QuestionTimeline
                postData={postData}
                keyFactors={postData.key_factors}
                isConsumerView={true}
                preselectedGroupQuestionId={preselectedGroupQuestionId}
                className={cn(
                  "hidden sm:block",
                  showSideBySide && "order-2 mt-0 flex-1",
                  isContinuousSingleQuestion && "mt-0"
                )}
              />
            )}
            {showClosedMessageFanGraph && (
              <p className="my-8 text-center text-sm leading-[20px] text-gray-700 dark:text-gray-700-dark">
                {t("predictionClosedMessage")}
              </p>
            )}
          </div>
        </div>
        {shouldShowKeyFactorsSection && (
          <div className="order-3 sm:order-none">
            <KeyFactorsQuestionConsumerSection post={postData} />
          </div>
        )}
      </section>
      <section className={commentSectionClassName}>
        <QuestionPageShellTabs post={postData} variant="consumer" />
      </section>
      {mobileSidebar}
    </div>
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
        consumer={
          <ContinuousChartCursorProvider>
            {/* Bridges timeline cursor to the mobile mini chart in consumer view */}
            <ConsumerShell
              postData={postData}
              preselectedGroupQuestionId={preselectedGroupQuestionId}
              mobileSidebar={mobileSidebar}
            />
          </ContinuousChartCursorProvider>
        }
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
