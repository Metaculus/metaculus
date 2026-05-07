"use client";

import { FC } from "react";

import CommentFeed from "@/components/comment_feed";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const CommentsTab: FC<Props> = ({ post }) => (
  <div className="[&>section]:!w-full [&>section]:!max-w-none [&>section]:!border-0 [&>section]:!bg-transparent [&>section]:!px-0 [&>section]:!py-0 [&>section]:after:!hidden">
    <CommentFeed postData={post} showTitle={false} />
  </div>
);

export default CommentsTab;
