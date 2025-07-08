import { FC } from "react";

import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatus from "@/components/post_status";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import ForecastersCounter from "../../components/forecaster_counter";

type Props = {
  post: PostWithForecasts;
};

const QuestionHeaderInfo: FC<Props> = ({ post }) => {
  const resolutionData = extractPostResolution(post);

  return (
    <div className="my-2 flex items-center justify-between gap-3 border-b border-t border-blue-500 font-medium dark:border-gray-500">
      <div className="flex items-center gap-2">
        <PostVoter post={post} questionPage />

        <PostStatus post={post} resolution={resolutionData} />

        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
        />
        {(post.group_of_questions ||
          post.question?.type === QuestionType.MultipleChoice) && (
          <ForecastersCounter
            forecasters={post.nr_forecasters}
            className="text-center !text-sm !text-gray-900 dark:!text-gray-900-dark"
          />
        )}
      </div>
    </div>
  );
};

export default QuestionHeaderInfo;
