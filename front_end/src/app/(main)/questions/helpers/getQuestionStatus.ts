import { PostStatus, PostWithForecasts } from "@/types/post";

export const getQuestionStatus = (post: PostWithForecasts | null) => {
  const isLive =
    post?.curation_status == PostStatus.APPROVED ||
    post?.curation_status == PostStatus.OPEN;
  const isDone =
    post?.curation_status == PostStatus.RESOLVED ||
    post?.curation_status == PostStatus.CLOSED ||
    post?.curation_status == PostStatus.DELETED;

  return { isLive, isDone };
};
