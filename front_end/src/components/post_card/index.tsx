import { FC } from "react";

import ConditionalTile from "@/components/conditional_tile";
import { PostWithForecasts } from "@/types/post";

import BasicPostCard from "./basic_post_card";
import PostCardErrorBoundary from "./error_boundary";
import QuestionChartTile from "./question_chart_tile";

type Props = {
  post: PostWithForecasts;
};

const PostCard: FC<Props> = ({ post }) => {
  return (
    <PostCardErrorBoundary>
      <BasicPostCard post={post} hideTitle={!!post.conditional}>
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
