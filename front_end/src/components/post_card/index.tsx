"use client";
import { FC, useCallback, useState } from "react";

import HideCPProvider from "@/app/(main)/questions/[id]/components/cp_provider";
import { createForecasts, getPost } from "@/app/(main)/questions/actions";
import ConditionalTile from "@/components/conditional_tile";
import NotebookTile from "@/components/post_card/notebook_tile";
import { useAuth } from "@/contexts/auth_context";
import { ForecastPayload } from "@/services/questions";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { isGroupOfQuestionsPost, isQuestionPost } from "@/utils/questions";

import BasicPostCard from "./basic_post_card";
import PostCardErrorBoundary from "./error_boundary";
import GroupOfQuestionsTile from "./group_of_questions_tile";
import QuestionChartTile from "./question_chart_tile";

type Props = {
  post: PostWithForecasts;
};

const PostCard: FC<Props> = ({ post }) => {
  const { user } = useAuth();
  const hideCP =
    user?.hide_community_prediction &&
    ![PostStatus.CLOSED, PostStatus.RESOLVED].includes(post.status);

  const [internalPost, setInternalPost] = useState<PostWithForecasts>(post);

  // submit reaffirmed forecast and update the post
  const handleReaffirm = useCallback(
    async (userForecast: ForecastPayload[]) => {
      if (!userForecast.length) {
        return;
      }

      await createForecasts(internalPost.id, userForecast, false);
      const postResponse = await getPost(internalPost.id);
      setInternalPost(postResponse);
    },
    [internalPost.id]
  );

  return (
    <PostCardErrorBoundary>
      <BasicPostCard
        post={internalPost}
        hideTitle={!!internalPost.conditional}
        borderVariant={internalPost.notebook ? "highlighted" : "regular"}
        borderColor={internalPost.notebook ? "purple" : "blue"}
      >
        <HideCPProvider post={internalPost}>
          {isQuestionPost(internalPost) && (
            <QuestionChartTile
              post={internalPost}
              hideCP={hideCP}
              onReaffirm={handleReaffirm}
            />
          )}
          {isGroupOfQuestionsPost(internalPost) && (
            <GroupOfQuestionsTile post={internalPost} hideCP={hideCP} />
          )}
          {!!internalPost.conditional && (
            <ConditionalTile
              postTitle={internalPost.title}
              conditional={internalPost.conditional}
              forecasters={internalPost.nr_forecasters}
            />
          )}
          {!!internalPost.notebook && (
            <NotebookTile notebook={internalPost.notebook} />
          )}
        </HideCPProvider>
      </BasicPostCard>
    </PostCardErrorBoundary>
  );
};

export default PostCard;
