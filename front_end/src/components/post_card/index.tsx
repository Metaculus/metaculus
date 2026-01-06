"use client";
import { FC, useState } from "react";

import ConditionalTile from "@/components/conditional_tile";
import NotebookTile from "@/components/post_card/notebook_tile";
import { CardReaffirmContextProvider } from "@/components/post_card/reaffirm_context";
import { useAuth } from "@/contexts/auth_context";
import HideCPProvider from "@/contexts/cp_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isNotebookPost,
  isQuestionPost,
} from "@/utils/questions/helpers";
import { canPredictQuestion } from "@/utils/questions/predictions";

import BasicPostCard from "./basic_post_card";
import PostCardErrorBoundary from "./error_boundary";
import GroupOfQuestionsTile from "./group_of_questions_tile";
import QuestionTile from "./question_tile";

type Props = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
  indexWeight?: number;
  minimalistic?: boolean;
};

const PostCard: FC<Props> = ({
  post,
  forCommunityFeed,
  indexWeight,
  minimalistic = false,
}) => {
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
          indexWeight={indexWeight}
          minimalistic={minimalistic}
        >
          <HideCPProvider post={internalPost}>
            {isQuestionPost(internalPost) && (
              <QuestionTile
                question={internalPost.question}
                authorUsername={post.author_username}
                curationStatus={post.status}
                hideCP={hideCP}
                canPredict={canPredict}
                minimalistic={minimalistic}
              />
            )}
            {isGroupOfQuestionsPost(internalPost) && (
              <GroupOfQuestionsTile
                post={internalPost}
                minimalistic={minimalistic}
              />
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
