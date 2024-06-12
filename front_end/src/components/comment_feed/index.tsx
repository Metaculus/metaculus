"use client";
import { FC } from "react";

import Comment from "@/components/comment_feed/comment";
import { CommentType } from "@/types/comment";
import Hr from "@/components/ui/hr";

type Props = {
  //totalCount: number;
  //next: any;
  //previous: any;
  comments: CommentType[];
};

const CommentFeed: FC<Props> = ({ comments }) => {
  //const [paginatedComments, setPaginatedComments] =
  //  useState<CommentType[]>(initialComments);
  //const [hasMoreData, setHasMoreData] = useState(
  //  paginatedComments.length < totalCount
  //);

  //const [isLoading, setIsLoading] = useState(false);

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
