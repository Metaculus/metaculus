import { FC } from "react";

import BasicPostCard from "./basic_post_card";
import PostCardErrorBoundary from "./error_boundary";
import GroupOfQuestionsTile from "./group_of_questions_tile";
import QuestionChartTile from "./question_chart_tile";

import ConditionalTile from "@/components/conditional_tile";
import NotebookTile from "@/components/post_card/notebook_tile";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const PostCard: FC<Props> = ({ post }) => {
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
          />
        )}
        {!!post.group_of_questions && (
          <GroupOfQuestionsTile
            questions={post.group_of_questions.questions}
            curationStatus={post.status}
          />
        )}
        {!!post.conditional && (
          <ConditionalTile
            postTitle={post.title}
            conditional={post.conditional}
            curationStatus={post.status}
          />
        )}
        {!!post.notebook && <NotebookTile notebook={post.notebook} />}
      </BasicPostCard>
    </PostCardErrorBoundary>
  );
};

export default PostCard;
