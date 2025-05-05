"use client";
import { isNil } from "lodash";
import { FC, useEffect, useState } from "react";

import BackgroundInfo from "@/app/(main)/questions/[id]/components/background_info";
import ResolutionCriteria from "@/app/(main)/questions/[id]/components/resolution_criteria";
import { getPost } from "@/app/(main)/questions/actions";
import ConditionalTile from "@/components/conditional_tile";
import DetailedGroupCard from "@/components/detailed_question_card/detailed_group_card";
import DetailedQuestionCard from "@/components/detailed_question_card/detailed_question_card";
import ForecastMaker from "@/components/forecast_maker";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import { usePredictionFlow } from "./prediction_flow_provider";
import SectionToggle from "@/components/ui/section_toggle";
import { useTranslations } from "next-intl";
import CommentFeed from "@/components/comment_feed";
import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
type Props = {};

const DetailedPost: FC<Props> = ({}) => {
  const [detailedPost, setDetailedPost] = useState<PostWithForecasts | null>(
    null
  );
  const t = useTranslations();
  // TODO: adjust condition
  const shouldShowBanner = true;
  const { setPosts, currentPostId, isPending, setIsPending } =
    usePredictionFlow();

  useEffect(() => {
    const fetchDetailedPost = async () => {
      setIsPending(true);
      const post = await getPost(currentPostId);
      console.log(post);
      setDetailedPost(post);
      setIsPending(false);
    };
    fetchDetailedPost();
  }, [currentPostId, setIsPending]);

  if (isPending) {
    return (
      <div className="mx-4 mt-2.5 flex flex-1 flex-grow flex-col items-center justify-center rounded bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:mx-0 sm:mt-6 sm:h-[300px] sm:p-8 sm:py-[26px]">
        <LoadingIndicator className="w-full" />
      </div>
    );
  }

  if (isNil(detailedPost)) {
    return null;
  }

  return (
    <div className="mx-4 mt-6 flex flex-col sm:mx-0">
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

          <ForecastMaker post={detailedPost} />
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

export default DetailedPost;
