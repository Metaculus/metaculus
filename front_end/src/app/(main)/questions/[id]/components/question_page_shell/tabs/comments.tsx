"use client";

import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import ResponsiveCommentFeed from "../../question_layout/consumer_question_layout/responsive_comment_feed";

type Props = {
  post: PostWithForecasts;
};

const CommentsTab: FC<Props> = ({ post }) => (
  <div className="[&>section]:!w-full [&>section]:!max-w-none [&>section]:!px-0">
    <ResponsiveCommentFeed postData={post} showTitle={false} />
  </div>
);

export default CommentsTab;
