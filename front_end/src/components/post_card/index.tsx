"use client";
import { FC, useState } from "react";

import HideCPProvider from "@/app/(main)/questions/[id]/components/cp_provider";
import ConditionalTile from "@/components/conditional_tile";
import NotebookTile from "@/components/post_card/notebook_tile";
import { CardReaffirmContextProvider } from "@/components/post_card/reaffirm_context";
import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import {
  canPredictQuestion,
  isConditionalPost,
  isGroupOfQuestionsPost,
  isNotebookPost,
  isQuestionPost,
} from "@/utils/questions";

import BasicPostCard from "./basic_post_card";
import PostCardErrorBoundary from "./error_boundary";
import GroupOfQuestionsTile from "./group_of_questions_tile";
import QuestionChartTile from "./question_chart_tile";

type Props = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
};

const PostCard: FC<Props> = ({ post, forCommunityFeed }) => {
  const { user } = useAuth();
  const hideCP =
    user?.hide_community_prediction &&
    ![PostStatus.CLOSED, PostStatus.RESOLVED].includes(post.status);

  const [internalPost, setInternalPost] = useState<PostWithForecasts>(post);

  const canPredict = canPredictQuestion(internalPost);

  return (
    <CardReaffirmContextProvider
      post={internalPost}
      onPostChanged={setInternalPost}
    >
      <PostCardErrorBoundary>
        <BasicPostCard
          post={internalPost}
          hideTitle={!!internalPost.conditional}
          borderVariant={internalPost.notebook ? "highlighted" : "regular"}
          borderColor={internalPost.notebook ? "purple" : "blue"}
          forCommunityFeed={forCommunityFeed}
        >
          <HideCPProvider post={internalPost}>
            {isQuestionPost(internalPost) && (
              <QuestionChartTile
                question={internalPost.question}
                authorUsername={post.author_username}
                curationStatus={post.status}
                hideCP={hideCP}
                forecasters={internalPost.question.nr_forecasters}
                canPredict={canPredict}
              />
            )}
            {isGroupOfQuestionsPost(internalPost) && (
              <GroupOfQuestionsTile post={internalPost} hideCP={hideCP} />
            )}
            {isConditionalPost(internalPost) && (
              <ConditionalTile post={internalPost} />
            )}
            {isNotebookPost(internalPost) && (
              <NotebookTile post={internalPost} />
            )}
          </HideCPProvider>
        </BasicPostCard>
      </PostCardErrorBoundary>
    </CardReaffirmContextProvider>
  );
};

export default PostCard;
