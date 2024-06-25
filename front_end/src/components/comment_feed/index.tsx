"use client";
import { FC, useState } from "react";

import Comment from "@/components/comment_feed/comment";
import Hr from "@/components/ui/hr";
import { CommentType } from "@/types/comment";

type Props = {
  //totalCount: number;
  //next: any;
  //previous: any;
  initialComments: CommentType[];
  postId?: number;
  profileId?: number;
};

const CommentFeed: FC<Props> = ({ initialComments, postId, profileId }) => {
  const [numberOfComments, setNumberOfComments] = useState(10);

  const comments = initialComments.slice(0, numberOfComments);

  let url = `${window.location.origin}`;

  if (postId) {
    url += `/questions/${postId}`;
  } else if (profileId) {
    url += `/accounts/profile/${profileId}`;
  }

  if (comments.length == 0) return null;
  return (
    <section className="max-w-[580px] p-6">
      {comments.map((comment: CommentType) => (
        <div key={comment.id}>
          <Hr className="my-4" />

          <Comment comment={comment} url={url} />
        </div>
      ))}
    </section>
  );
};

export default CommentFeed;
