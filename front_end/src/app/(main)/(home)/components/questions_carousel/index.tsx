import React from "react";
import { FC } from "react";

import PostsApi from "@/services/posts";
import { PostWithForecasts } from "@/types/post";

import QuestionCarouselItem from "./carousel_item";

type Props = {
  postIds: number[];
};

const QuestionCarousel: FC<Props> = async ({ postIds }) => {
  const postsResponse = await Promise.all(
    postIds.map((postId) => PostsApi.getPost(postId))
  );
  const posts = postsResponse.filter(
    (post) => post !== null
  ) as PostWithForecasts[];

  return (
    <div className="flex flex-row gap-8 overflow-x-scroll p-4">
      {posts.map((p) => (
        <QuestionCarouselItem key={p.id} post={p} />
      ))}
    </div>
  );
};

export default QuestionCarousel;
