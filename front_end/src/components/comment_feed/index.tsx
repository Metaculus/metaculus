"use client";
import { FC, useState } from "react";

import Comment from "@/components/comment_feed/comment";
import CommentEditor from "@/components/comment_feed/comment_editor";
import ButtonGroup from "@/components/ui/button_group";
import Hr from "@/components/ui/hr";
import { CommentPermissions, CommentType } from "@/types/comment";
import { Post, ProjectPermissions } from "@/types/post";
import { UserProfile } from "@/types/users";

type Props = {
  initialComments: CommentType[];
  post?: Post;
  profile?: UserProfile;
};

const feedOptions = [
  {
    id: "public",
    label: "public",
  },
  {
    id: "private",
    label: "private",
  },
];

const CommentFeed: FC<Props> = ({ initialComments, post, profile }) => {
  const [numberOfComments, setNumberOfComments] = useState(10);
  const [feedSection, setFeedSection] = useState("public");

  const comments = initialComments
    .slice(0, numberOfComments)
    .filter((comment) =>
      feedSection === "public" ? !comment.is_private : comment.is_private
    );
  let url = "";

  let permissions: CommentPermissions = CommentPermissions.VIEWER;
  if (post?.id) {
    url += `/questions/${post.id}`;
    if (
      post.user_permission === ProjectPermissions.ADMIN ||
      post.user_permission === ProjectPermissions.CURATOR
    ) {
      permissions = CommentPermissions.CURATOR;
    }
  } else if (profile?.id) {
    url += `/accounts/profile/${profile.id}`;
  }

  return (
    <section>
      <Hr className="my-4" />
      <div className="my-4 flex flex-row gap-4">
        <h2
          className="mb-1 mt-0 flex scroll-mt-16 items-baseline justify-between break-anywhere"
          id="comment-section"
        >
          Comments
        </h2>
        <ButtonGroup
          value={feedSection}
          buttons={feedOptions}
          onChange={(selection) => {
            setFeedSection(selection);
          }}
          variant="tertiary"
        />
      </div>
      {post && <CommentEditor />}
      {comments.map((comment: CommentType) => (
        <div key={comment.id}>
          <Hr className="my-4" />

          <Comment comment={comment} url={url} permissions={permissions} />
        </div>
      ))}
      {comments.length == 0 && (
        <>
          <Hr className="my-4" />
          <div className="text-center italic text-gray-700 dark:text-gray-700-dark">
            no comments
          </div>
        </>
      )}
    </section>
  );
};

export default CommentFeed;
