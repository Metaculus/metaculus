import { FC } from "react";

import ConditionalTile from "@/components/conditional_tile";
import { PostWithForecasts } from "@/types/post";

import BasicPostCard from "./basic_post_card";
import PostCardErrorBoundary from "./error_boundary";
import GroupOfQuestionsTile from "./group_of_questions_tile";
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
              authorUsername={post.author_username}
              curationStatus={post.curation_status}
            />
          )}
          {!!post.group_of_questions && (
            <GroupOfQuestionsTile
              questions={post.group_of_questions.questions}
              curationStatus={post.curation_status}
            />
          )}
          {!!post.conditional && (
            <ConditionalTile
              conditional={post.conditional}
              curationStatus={post.curation_status}
            />
          )}
        </div>
      </BasicPostCard>
    </PostCardErrorBoundary>
  );
};

export default PostCard;
