import { FC } from "react";

import BasicPostCard from "@/components/question_card/basic_card";
import QuestionChartTile from "@/components/question_card/chart_tile";
import PostCardErrorBoundary from "@/components/question_card/error_boundary";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const PostCard: FC<Props> = ({ post }) => {
  return (
    <PostCardErrorBoundary>
      <BasicPostCard post={post}>
        <div className="mb-0.5 pt-1.5">
          <QuestionChartTile question={post?.question} />
        </div>
      </BasicPostCard>
    </PostCardErrorBoundary>
  );
};

export default PostCard;
