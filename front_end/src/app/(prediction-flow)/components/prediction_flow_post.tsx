"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import BackgroundInfo from "@/app/(main)/questions/[id]/components/background_info";
import ResolutionCriteria from "@/app/(main)/questions/[id]/components/resolution_criteria";
import { fetchPosts, getPost } from "@/app/(main)/questions/actions";
import CommentFeed from "@/components/comment_feed";
import ConditionalTile from "@/components/conditional_tile";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isPostPredicted } from "@/utils/forecasts/helpers";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { usePredictionFlow } from "./prediction_flow_provider";

type Props = {
  tournamentSlug: string;
};

const PredictionFlowPost: FC<Props> = ({ tournamentSlug }) => {
  const [detailedPost, setDetailedPost] = useState<PostWithForecasts | null>(
    null
  );
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const t = useTranslations();
  // TODO: adjust condition
  const shouldShowBanner = true;
  const { posts, setPosts, currentPostId, setIsPending, isMenuOpen } =
    usePredictionFlow();

  useEffect(() => {
    const fetchDetailedPost = async () => {
      setIsLoadingPost(true);
      if (isNil(currentPostId)) {
        setIsLoadingPost(false);
        return;
      }
      const post = await getPost(currentPostId);
      console.log(post);
      setDetailedPost(post);
      setIsLoadingPost(false);
    };
    fetchDetailedPost();
  }, [currentPostId, setIsLoadingPost]);

  // update chart data with new forecasts
  const onPredictionSubmit = useCallback(async () => {
    if (isNil(currentPostId)) {
      return;
    }
    // update datailed post data
    const post = await getPost(currentPostId);
    setDetailedPost(post);
    // update prediction flow posts data
    // TODO: replace with new endpoint to fetch data for prediction flow
    const { questions } = await fetchPosts({ ids: [currentPostId] }, 0, 1);
    setPosts(
      posts.map((prevPost) => {
        if (!questions[0]) {
          return prevPost;
        }
        return prevPost?.id === currentPostId
          ? { ...questions[0], isDone: true } // TODO: check for withdrawal
          : prevPost;
      })
    );
    setIsPending(false);
  }, [currentPostId, setIsPending, posts, setPosts]);

  if (isLoadingPost) {
    return (
      <div
        className={cn(
          "mx-4 mt-2.5 flex flex-1 flex-grow flex-col items-center justify-center rounded bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:mx-0 sm:mt-6 sm:h-[300px] sm:p-8 sm:py-[26px]",
          {
            hidden: isMenuOpen,
          }
        )}
      >
        <LoadingIndicator className="w-full" />
      </div>
    );
  }

  if (isNil(currentPostId)) {
    return <FinalFlowView tournamentSlug={tournamentSlug} />;
  }

  if (isNil(detailedPost)) {
    return null;
  }

  return (
    <div
      className={cn("mx-4 mt-6 flex flex-col sm:mx-0", {
        hidden: isMenuOpen,
      })}
    >
      {shouldShowBanner && (
        <div className="dark:bg-orange-50-dark rounded-t border-b border-blue-400 bg-orange-50 px-4 py-3 text-center text-xs font-medium leading-4 text-orange-900 dark:border-blue-400-dark dark:text-orange-900-dark">
          Community prediction increased by 25 percentage points since your last
          forecast.
        </div>
      )}
      <div
        className={cn(
          "flex w-full flex-col rounded bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:p-8 sm:py-[26px]",
          {
            "rounded-t-none": shouldShowBanner,
          }
        )}
      >
        <div className="flex flex-col gap-4">
          <h2 className="m-0 text-2xl font-bold leading-8">
            {detailedPost?.title}
          </h2>
          {isConditionalPost(detailedPost) && (
            <ConditionalTile
              post={detailedPost}
              withNavigation
              withCPRevealBtn
            />
          )}

          {isQuestionPost(detailedPost) && (
            <DetailedQuestionCard post={detailedPost} />
          )}
          {isGroupOfQuestionsPost(detailedPost) && (
            <DetailedGroupCard post={detailedPost} />
          )}

          <ForecastMaker
            post={detailedPost}
            onPredictionSubmit={onPredictionSubmit}
          />

          <div className="flex flex-col gap-2">
            <ResolutionCriteria
              post={detailedPost}
              defaultOpen={false}
              className="my-0 gap-2"
            />
            <BackgroundInfo post={detailedPost} defaultOpen={false} />
            <SectionToggle title={t("comments")} defaultOpen={false}>
              <CommentsFeedProvider
                postData={detailedPost}
                rootCommentStructure={true}
              >
                {/* TODO: remove title */}
                <CommentFeed postData={detailedPost} />
              </CommentsFeedProvider>
            </SectionToggle>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinalFlowView = ({ tournamentSlug }: { tournamentSlug: string }) => {
  const { posts, setCurrentPostId } = usePredictionFlow();
  const t = useTranslations();
  const skippedQuestions = posts.filter((post) => !isPostPredicted(post));

  const handleReviewSkippedQuestions = useCallback(() => {
    if (skippedQuestions[0]) {
      setCurrentPostId(skippedQuestions[0].id);
    }
  }, [skippedQuestions, setCurrentPostId]);
  return (
    <div className="mx-4 mb-auto mt-2.5 flex flex-col items-center rounded bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:mx-0 sm:mt-6 sm:items-start sm:p-8 sm:py-[26px]">
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark sm:text-left">
        {t("youSubmittedPredictionsFor", {
          count: posts.length - skippedQuestions.length,
          total: posts.length,
        })}
      </h2>
      {!!skippedQuestions.length && (
        <p className="m-0 mt-3 text-sm text-gray-700 dark:text-gray-700-dark sm:mt-5">
          {t("skippedWithoutForecasting", {
            count: skippedQuestions.length,
          })}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-5">
        {!!skippedQuestions.length && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={handleReviewSkippedQuestions}
          >
            {t("reviewSkippedQuestions")}
          </Button>
        )}
        <Button
          variant="tertiary"
          size="sm"
          href={`/tournament/${tournamentSlug}`}
        >
          {t("exitPredictionFlow")}
        </Button>
      </div>
    </div>
  );
};

export default PredictionFlowPost;
