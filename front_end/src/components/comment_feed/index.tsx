import Comment from "@/components/comment_feed/comment";
import { CommentType } from "@/types/comment";

export default async function CommentFeed({
  comments,
}: {
  comments: CommentType[];
}) {
  return (
    <section>
      {comments.map((comment: CommentType) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </section>
  );
}
