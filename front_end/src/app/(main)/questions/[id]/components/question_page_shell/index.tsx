"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, Fragment, ReactNode, useEffect } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import ConditionalTimeline from "@/components/conditional_timeline";
import DateForecastCard from "@/components/consumer_post_card/group_forecast_card/date_forecast_card";
import NumericForecastCard from "@/components/consumer_post_card/group_forecast_card/numeric_forecast_card";
import PercentageForecastCard from "@/components/consumer_post_card/group_forecast_card/percentage_forecast_card";
import UpcomingCP from "@/components/consumer_post_card/upcoming_cp";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import MarkdownEditor from "@/components/markdown_editor";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import SectionToggle from "@/components/ui/section_toggle";
import {
  ContinuousChartCursorProvider,
  useContinuousChartCursor,
} from "@/contexts/continuous_chart_cursor_context";
import { useHideCP } from "@/contexts/cp_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { usePostTextSections } from "@/hooks/use_post_text_sections";
import {
  GroupOfQuestionsGraphType,
  GroupOfQuestionsPost,
  PostStatus,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { TournamentType } from "@/types/projects";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
import {
  checkGroupOfQuestionsPostType,
  isConditionalPost,
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
import ConsumerGroupChart from "../question_view/consumer_question_view/consumer_group_chart";
import ConsumerListChartShell from "../question_view/consumer_question_view/consumer_list_chart_shell";
import ConsumerTimeSeriesPane from "../question_view/consumer_question_view/consumer_time_series_pane";
import FanGraphChartPanel from "../question_view/consumer_question_view/fan_graph_chart_panel";
import ConsumerQuestionPrediction from "../question_view/consumer_question_view/prediction";
import QuestionTimeline from "../question_view/consumer_question_view/timeline";
import QuestionHeaderCPStatus from "../question_view/forecaster_question_view/question_header/question_header_cp_status";
import RevealCPButton from "../reveal_cp_button";

const baseSectionClassName =
  "relative flex w-[59rem] max-w-full flex-col gap-6 overflow-x-clip rounded border border-blue-400 p-4 text-gray-900 dark:border-blue-200-dark dark:text-gray-900-dark lg:p-8";

const mainSectionClassName = `${baseSectionClassName} z-10 bg-gray-0 dark:bg-gray-0-dark`;
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

  const sections = usePostTextSections(postData, {
    excludeFinePrint: true,
    excludeResolutionCriteria: true,
  });
  const isResolved = postData.status === PostStatus.RESOLVED;
  const isGroup = isGroupOfQuestionsPost(postData);
  const showChartDivider =
    isMultipleChoicePost(postData) ||
    (isGroup && checkGroupOfQuestionsPostType(postData, QuestionType.Binary));
  const isForecasterFanGraph =
    postData.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.FanGraph;

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
          {showChartDivider && (
            <div className="mb-2 h-px bg-gray-400 opacity-30 dark:bg-gray-400-dark lg:mb-3" />
          )}
          <div className="-mt-2 lg:-mt-3">
            {isQuestionPost(postData) && (
              <DetailedQuestionCard
                post={postData}
                keyFactors={postData.key_factors}
              />
            )}
            {isGroup &&
              (isForecasterFanGraph ? (
                <FanGraphChartPanel
                  post={
                    postData as GroupOfQuestionsPost<QuestionWithNumericForecasts>
                  }
                  preselectedQuestionId={preselectedGroupQuestionId}
                />
              ) : (
                <DetailedGroupCard
                  post={postData}
                  preselectedQuestionId={preselectedGroupQuestionId}
                />
              ))}
            {isConditionalPost(postData) && (
              <ConditionalTimeline post={postData} />
            )}
          </div>
          {(!isResolved || isGroup) && <ForecastMaker post={postData} />}
          <ResolutionCriteria post={postData} defaultOpen />
          {sections.length > 0 && (
            <div className="flex flex-col gap-2">
              {sections.map((section) => (
                <SectionToggle
                  key={section.title}
                  title={section.title}
                  variant="dark"
                  wrapperClassName="bg-opacity-50"
                  className="font-medium"
                >
                  <MarkdownEditor withCodeBlocks markdown={section.markdown} />
                </SectionToggle>
              ))}
            </div>
          )}
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

const BinaryCursorGauge: FC<{
  question: QuestionWithForecasts;
}> = ({ question }) => {
  const cursorCtx = useContinuousChartCursor();
  return (
    <QuestionHeaderCPStatus
      question={question}
      size="lg"
      cursorBinaryValue={cursorCtx?.activeBinaryValue}
    />
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

  const isContinuousSingleQuestion =
    isQuestionPost(postData) && isContinuousQuestion(postData.question);

  const isBinarySingleQuestion =
    isQuestionPost(postData) &&
    !isContinuousSingleQuestion &&
    !isMultipleChoice;

  const isNRowBody = isMultipleChoice || isNonFanGroup || isFanGraph;

  const isContinuousNumericGroup =
    isNonFanGroup &&
    !isDateGroup &&
    !isMultipleChoice &&
    (checkGroupOfQuestionsPostType(postData, QuestionType.Numeric) ||
      checkGroupOfQuestionsPostType(postData, QuestionType.Discrete));

  const binaryForecastAvailability =
    isBinarySingleQuestion && isQuestionPost(postData)
      ? getQuestionForecastAvailability(postData.question)
      : null;

  const mcForecastAvailability =
    isMultipleChoice && isQuestionPost(postData)
      ? getQuestionForecastAvailability(postData.question)
      : null;

  const showClosedMessageMultipleChoice =
    isMultipleChoicePost(postData) &&
    postData.question.status === QuestionStatus.CLOSED;

  const showClosedMessageFanGraph =
    isFanGraph && postData.status === PostStatus.CLOSED;

  const fanGraphQuestions = isFanGraph
    ? sortGroupPredictionOptions(
        (postData.group_of_questions?.questions ??
          []) as QuestionWithNumericForecasts[],
        postData.group_of_questions
      )
    : null;

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
          {isConditionalPost(postData) ? (
            <QuestionTimeline
              postData={postData}
              isConsumerView
              className="mt-0 hidden sm:block"
            />
          ) : isBinarySingleQuestion && isQuestionPost(postData) ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-0 md:gap-8">
              <div className="order-1 flex w-64 flex-col items-center justify-center gap-[18px] self-center sm:self-stretch">
                {binaryForecastAvailability?.cpRevealsOn ? (
                  <UpcomingCP
                    cpRevealsOn={binaryForecastAvailability.cpRevealsOn}
                  />
                ) : hideCP ? (
                  <RevealCPButton />
                ) : (
                  <BinaryCursorGauge question={postData.question} />
                )}
              </div>
              <QuestionTimeline
                postData={postData}
                keyFactors={postData.key_factors}
                isConsumerView
                preselectedGroupQuestionId={preselectedGroupQuestionId}
                className="order-2 mt-0 hidden flex-1 sm:block"
              />
            </div>
          ) : isContinuousSingleQuestion ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-8">
              <div className="order-1 md:hidden">
                <ConsumerQuestionPrediction postData={postData} />
              </div>
              <QuestionTimeline
                postData={postData}
                keyFactors={postData.key_factors}
                isConsumerView={false}
                preselectedGroupQuestionId={preselectedGroupQuestionId}
                className="order-2 mt-0 hidden flex-1 sm:block"
              />
            </div>
          ) : isNRowBody ? (
            <>
              {isDateGroup && postData.group_of_questions && (
                <div className="block sm:hidden">
                  <DateForecastCard
                    post={postData}
                    questionsGroup={postData.group_of_questions}
                    innerChartPaddingX={20}
                    yearOnlyTicks
                  />
                </div>
              )}
              <ConsumerListChartShell
                stretchListContent={!hideCP && !isFanGraph}
                hideListOnMobile={!!isDateGroup}
                hideDivider={!!isDateGroup}
                hideBorder={false}
                reduceInnerPadding={!!isDateGroup}
                listContent={
                  hideCP && !mcForecastAvailability?.cpRevealsOn ? (
                    <RevealCPButton />
                  ) : isFanGraph && fanGraphQuestions ? (
                    <ConsumerTimeSeriesPane
                      questions={fanGraphQuestions.slice(-4)}
                    />
                  ) : isContinuousNumericGroup ? (
                    <NumericForecastCard post={postData} fillHeight />
                  ) : isDateGroup ? (
                    <NumericForecastCard
                      post={postData}
                      fillHeight
                      borderOnly
                    />
                  ) : (
                    <PercentageForecastCard
                      post={postData}
                      forceColorful
                      fillHeight
                    />
                  )
                }
                chartContent={
                  isFanGraph ? (
                    <FanGraphChartPanel
                      post={
                        postData as GroupOfQuestionsPost<QuestionWithNumericForecasts>
                      }
                      preselectedQuestionId={preselectedGroupQuestionId}
                      visibleQuestions={fanGraphQuestions?.slice(-4)}
                      variant="consumer"
                    />
                  ) : isContinuousNumericGroup ? (
                    <ConsumerGroupChart
                      post={
                        postData as GroupOfQuestionsPost<QuestionWithNumericForecasts>
                      }
                      preselectedQuestionId={preselectedGroupQuestionId}
                    />
                  ) : isDateGroup && postData.group_of_questions ? (
                    <DateForecastCard
                      post={postData}
                      questionsGroup={postData.group_of_questions}
                      fillHeight
                      innerChartPaddingX={40}
                      yearOnlyTicks
                    />
                  ) : (
                    <QuestionTimeline
                      postData={postData}
                      keyFactors={postData.key_factors}
                      isConsumerView
                      preselectedGroupQuestionId={preselectedGroupQuestionId}
                      className="mt-0"
                    />
                  )
                }
              />
              {showClosedMessageFanGraph && (
                <p className="my-8 text-center text-sm leading-[20px] text-gray-700 dark:text-gray-700-dark">
                  {t("predictionClosedMessage")}
                </p>
              )}
            </>
          ) : (
            <ConsumerQuestionPrediction postData={postData} />
          )}
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
          <ContinuousChartCursorProvider>
            <ForecasterShell
              postData={postData}
              preselectedGroupQuestionId={preselectedGroupQuestionId}
              mobileSidebar={mobileSidebar}
            />
          </ContinuousChartCursorProvider>
        }
      />
    </QuestionLayoutProvider>
  );
};

export default QuestionPageShell;
