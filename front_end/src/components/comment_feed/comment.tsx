import { FC } from "react";

import { CommentType } from "@/types/comment";

type Props = {
  comment: CommentType;
};

const Comment: FC<Props> = ({ comment: CommentType }) => {
  return <div>baba</div>;
};

export default Comment;
