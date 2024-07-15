"use client";
import { FC, useEffect, useState } from "react";

import { markPostAsRead } from "@/app/(main)/questions/actions";
import { getComments } from "@/app/(main)/questions/actions";
import Comment from "@/components/comment_feed/comment";
import CommentEditor from "@/components/comment_feed/comment_editor";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import { useAuth } from "@/contexts/auth_context";
import { CommentPermissions, CommentType } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

type Props = {
  postId?: number;
  postPermissions: ProjectPermissions;
  profileId?: number;
};

const feedOptions: GroupButton<string>[] = [
  {
    value: "public",
    label: "public",
  },
  {
    value: "private",
    label: "private",
  },
];

const CommentFeed: FC<Props> = ({ postId, postPermissions, profileId }) => {
  const { user } = useAuth();

  const [feedSection, setFeedSection] = useState("public");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [shownComments, setShownComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    setShownComments(
      comments.filter((comment) =>
        feedSection === "public" ? !comment.is_private : comment.is_private
      )
    );
  }, [comments, feedSection]);

  const fetchComments = async (url: string = "/comments") => {
    try {
      const response = await getComments(url, {
        post: postId,
        author: profileId,
        parent_isnull: postId ? true : false,
      });
      setComments(() => [...response]);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
    }
  };

  let url = "";

  let permissions: CommentPermissions = CommentPermissions.VIEWER;
  if (postId) {
    url += `/questions/${postId}`;
    if (
      postPermissions === ProjectPermissions.ADMIN ||
      postPermissions === ProjectPermissions.CURATOR
    ) {
      permissions = CommentPermissions.CURATOR;
    }
  } else if (profileId) {
    url += `/accounts/profile/${profileId}`;
  }

  useEffect(() => {
    if (user?.id && postId) {
      // Send BE request that user has read the post
      const handler = setTimeout(() => {
        markPostAsRead(postId).then();
      }, 200);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [postId, user?.id]);

  return (
    <section>
      <hr className="my-4" />
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
      {postId && <CommentEditor postId={postId} />}
      {shownComments.map((comment: CommentType) => (
        <div key={comment.id}>
          <hr className="my-4" />

          <Comment comment={comment} url={url} permissions={permissions} />
        </div>
      ))}
      {comments.length == 0 && (
        <>
          <hr className="my-4" />
          <div className="text-center italic text-gray-700 dark:text-gray-700-dark">
            no comments
          </div>
        </>
      )}
    </section>
  );
};

export default CommentFeed;
