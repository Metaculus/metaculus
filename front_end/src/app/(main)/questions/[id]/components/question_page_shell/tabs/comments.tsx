"use client";

import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import ResponsiveCommentFeed from "../../question_layout/consumer_question_layout/responsive_comment_feed";

type Props = {
  post: PostWithForecasts;
};

const CommentsTab: FC<Props> = ({ post }) => (
  <div className="[&>section]:!w-full [&>section]:!max-w-none [&>section]:!border-0 [&>section]:!bg-transparent [&>section]:!px-0 [&>section]:!py-0 [&>section]:after:!hidden">
    <ResponsiveCommentFeed postData={post} showTitle={false} />
  </div>
);

export default CommentsTab;
