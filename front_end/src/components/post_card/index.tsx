import { FC } from "react";

import BasicPostCard from "@/components/post_card/common/basic_card";
import PostCardErrorBoundary from "@/components/post_card/common/error_boundary";
import ConditionalTile from "@/components/post_card/question/conditional_tile";
import QuestionChartTile from "@/components/post_card/question/question_chart_tile";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const PostCard: FC<Props> = ({ post }) => {
  return (
    <PostCardErrorBoundary>
      <BasicPostCard post={post}>
        <div className="mb-0.5 pt-1.5">
          {!!post?.question && (
            <QuestionChartTile
              question={post?.question}
              author_username={post.author_username}
            />
          )}
          {!!post.conditional && (
            <ConditionalTile conditional={post.conditional} />
          )}
        </div>
      </BasicPostCard>
    </PostCardErrorBoundary>
  );
};

export default PostCard;
