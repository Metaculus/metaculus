import { FC } from "react";

import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatus from "@/components/post_status";
import { PostWithForecasts } from "@/types/post";
import { extractPostResolution } from "@/utils/questions";

type Props = {
  post: PostWithForecasts;
};

const QuestionHeaderInfo: FC<Props> = ({ post }) => {
  const resolutionData = extractPostResolution(post);
  let newCommentsCount = post.comment_count ? post.comment_count : 0;
  if (post.unread_comment_count !== undefined) {
    newCommentsCount = post.unread_comment_count;
  }
  return (
    <div className="my-2 flex items-center justify-between gap-3 border-b border-t border-blue-500 font-medium dark:border-gray-500">
      <div className="flex items-center gap-2">
        <PostVoter className="md:min-w-20" post={post} questionPage />

        <PostStatus post={post} resolution={resolutionData} />

        <CommentStatus
          newCommentsCount={newCommentsCount}
          url={`/questions/${post.id}`}
        />
      </div>
    </div>
  );
};

export default QuestionHeaderInfo;
