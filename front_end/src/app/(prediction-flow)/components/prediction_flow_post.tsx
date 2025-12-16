"use client";
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import { CoherenceLinksProvider } from "@/app/(main)/components/coherence_links_provider";
import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import ForecastMaker from "@/components/forecast_maker";
import BackgroundInfo from "@/components/question/background_info";
import PrivateNote from "@/components/question/private_note";
import ResolutionCriteria from "@/components/question/resolution_criteria";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import HideCPProvider from "@/contexts/cp_context";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";
import { getPostLink } from "@/utils/navigation";

import PredictionFlowCommentsSection from "./prediction_flow_comments";
import { usePredictionFlow } from "./prediction_flow_provider";
import PredictionFlowQuestionCard from "./prediction_flow_question_card";
import RequireAttentionBanner from "./require_attention_banner";

type Props = {
  tournamentSlug: string;
};

const PredictionFlowPost: FC<Props> = ({ tournamentSlug }) => {
  const [detailedPost, setDetailedPost] = useState<PostWithForecasts | null>(
    null
  );
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const {
    posts,
    currentPostId,
    setIsPending,
    isMenuOpen,
    flowType,
    handlePostPredictionSubmit,
  } = usePredictionFlow();
  const shouldShowBanner = !isNil(flowType);
  const currentFlowPost = posts.find((post) => post.id === currentPostId);
  useEffect(() => {
    const fetchDetailedPost = async () => {
      setIsLoadingPost(true);
      if (isNil(currentPostId)) {
        setIsLoadingPost(false);
        return;
      }
      const post = await ClientPostsApi.getPost(currentPostId);

      setDetailedPost(post);
      setIsLoadingPost(false);
    };
    fetchDetailedPost();
  }, [currentPostId]);

  const onPredictionSubmit = useCallback(async () => {
    if (isNil(currentPostId)) {
      return;
    }
    // update prediction flow posts data
    const flowPosts =
      await ClientPostsApi.getTournamentForecastFlowPosts(tournamentSlug);
    const currentPost = flowPosts.find((post) => post.id === currentPostId);
    if (currentPost) {
      // update detailed post if we don't move to the next question
      if (!isPostOpenQuestionPredicted(currentPost)) {
        const post = await ClientPostsApi.getPost(currentPostId);
        setDetailedPost(post);
      }
      handlePostPredictionSubmit(currentPost);
    }
    setIsPending(false);
  }, [currentPostId, setIsPending, tournamentSlug, handlePostPredictionSubmit]);

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

  if (isNil(detailedPost) || isNil(currentFlowPost)) {
    return null;
  }

  const forceHideCP = !isPostOpenQuestionPredicted(detailedPost);

  return (
    <HideCPProvider post={detailedPost} forceHideCP={forceHideCP}>
      <CoherenceLinksProvider post={detailedPost}>
        <div
          className={cn("mx-4 mt-6 flex flex-col sm:mx-0", {
            hidden: isMenuOpen,
          })}
        >
          {shouldShowBanner && (
            <RequireAttentionBanner detailedPost={currentFlowPost} />
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
                <Link
                  href={getPostLink(detailedPost, detailedPost.question?.id)}
                  className="text-blue-800 no-underline outline-none hover:underline focus-visible:underline dark:text-blue-800-dark"
                  prefetch={false}
                >
                  {detailedPost.title}
                </Link>
              </h2>

              <PredictionFlowQuestionCard post={detailedPost} />

              <div className="my-4">
                <ForecastMaker
                  post={detailedPost}
                  onPredictionSubmit={onPredictionSubmit}
                  disableResolveButtons={true}
                />
              </div>

              <div className="flex flex-col gap-2">
                <ResolutionCriteria
                  post={detailedPost}
                  defaultOpen={false}
                  className="my-0 gap-2"
                />
                <BackgroundInfo post={detailedPost} defaultOpen={false} />

                <PrivateNote post={detailedPost} />

                <CommentsFeedProvider
                  postData={detailedPost}
                  rootCommentStructure={true}
                >
                  <PredictionFlowCommentsSection postData={detailedPost} />
                </CommentsFeedProvider>
              </div>
            </div>
          </div>
        </div>
      </CoherenceLinksProvider>
    </HideCPProvider>
  );
};

const FinalFlowView = ({ tournamentSlug }: { tournamentSlug: string }) => {
  const { posts, changeActivePost, flowType } = usePredictionFlow();
  const t = useTranslations();
  const skippedQuestions = posts.filter((post) =>
    isNil(flowType) ? !isPostOpenQuestionPredicted(post) : !post.isDone
  );

  const handleReviewSkippedQuestions = useCallback(() => {
    if (!isNil(skippedQuestions[0])) {
      changeActivePost(skippedQuestions[0].id, true);
    }
  }, [skippedQuestions, changeActivePost]);

  return (
    <div className="mx-4 mb-auto mt-2.5 flex flex-col items-center rounded bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:mx-0 sm:mt-6 sm:items-start sm:p-8 sm:py-[26px]">
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark sm:text-left">
        {t("youSubmittedPredictionsFor", {
          count: posts.length - skippedQuestions.length,
          total: posts.length,
        })}
      </h2>
      {!!skippedQuestions.length && (
        <p className="m-0 mt-3 text-center text-sm text-gray-700 dark:text-gray-700-dark sm:mt-5 sm:text-left">
          {t("skippedWithoutPredicting", {
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
