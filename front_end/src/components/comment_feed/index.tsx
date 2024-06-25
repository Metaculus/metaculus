"use client";
import { FC, useState } from "react";

import Comment from "@/components/comment_feed/comment";
import Hr from "@/components/ui/hr";
import { CommentPermissions, CommentType } from "@/types/comment";
import { Post, ProjectPermissions } from "@/types/post";
import { UserProfile } from "@/types/users";

type Props = {
  initialComments: CommentType[];
  post?: Post;
  profile?: UserProfile;
};

const CommentFeed: FC<Props> = ({ initialComments, post, profile }) => {
  const [numberOfComments, setNumberOfComments] = useState(10);

  const comments = initialComments.slice(0, numberOfComments);

  let url = "";

  let permissions: CommentPermissions = CommentPermissions.VIEWER;
  if (post?.id) {
    url += `/questions/${post.id}`;
    if (
      post.user_permission == ProjectPermissions.ADMIN ||
      post.user_permission == ProjectPermissions.CURATOR
    ) {
      permissions = CommentPermissions.CURATOR;
    }
  } else if (profile?.id) {
    url += `/accounts/profile/${profile.id}`;
  }

  if (comments.length == 0) return null;
  return (
    <section className="max-w-[580px] p-6">
      {comments.map((comment: CommentType) => (
        <div key={comment.id}>
          <Hr className="my-4" />

          <Comment comment={comment} url={url} permissions={permissions} />
        </div>
      ))}
    </section>
  );
};

export default CommentFeed;
