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
};

const CommentFeed: FC<Props> = ({ initialComments }) => {
  const [numberOfComments, setNumberOfComments] = useState(10);

  const comments = initialComments.slice(0, numberOfComments);

  if (comments.length == 0) return null;
  return (
    <section>
      {comments.map((comment: CommentType) => (
        <div key={comment.id}>
          <Hr className="my-4" />

          <Comment comment={comment} />
        </div>
      ))}
    </section>
  );
};

export default CommentFeed;
