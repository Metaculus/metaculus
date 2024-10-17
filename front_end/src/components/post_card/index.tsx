import { FC } from "react";

import ConditionalTile from "@/components/conditional_tile";
import NotebookTile from "@/components/post_card/notebook_tile";
import { useAuth } from "@/contexts/auth_context";
import { PostStatus, PostWithForecasts } from "@/types/post";

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

  return (
    <PostCardErrorBoundary>
      <BasicPostCard
        post={post}
        hideTitle={!!post.conditional}
        borderVariant={post.notebook ? "highlighted" : "regular"}
        borderColor={post.notebook ? "purple" : "blue"}
      >
        {!!post?.question && (
          <QuestionChartTile
            question={post?.question}
            authorUsername={post.author_username}
            curationStatus={post.status}
            hideCP={hideCP}
          />
        )}
        {!!post.group_of_questions &&
          (!hideCP || post.curation_status != PostStatus.APPROVED) && (
            <GroupOfQuestionsTile
              questions={post.group_of_questions.questions}
              curationStatus={post.status}
              post={post}
            />
          )}
        {!!post.conditional &&
        (!hideCP || post.curation_status != PostStatus.APPROVED) ? (
          <ConditionalTile
            postTitle={post.title}
            conditional={post.conditional}
            curationStatus={post.status}
          />
        ) : (
          !!post.conditional && (
            <div>
              {post.conditional?.condition_child.title} - Conditional on -{" "}
              {post.conditional?.condition.title}
            </div>
          )
        )}
        {!!post.notebook && <NotebookTile notebook={post.notebook} />}
      </BasicPostCard>
    </PostCardErrorBoundary>
  );
};

export default PostCard;
