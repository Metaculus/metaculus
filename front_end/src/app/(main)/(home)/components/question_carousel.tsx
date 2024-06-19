import React from "react";
import { FC } from "react";

import PostCard from "@/components/post_card";
import PostsApi from "@/services/posts";
import { PostWithForecasts } from "@/types/post";

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
    <div className="flex flex-row overflow-x-scroll p-4">
      {posts.map((p, idx) => (
        <div key={idx} className="ml-4 h-[320px] w-[500px]">
          <PostCard post={p} />
        </div>
      ))}
    </div>
  );
};

export default QuestionCarousel;
