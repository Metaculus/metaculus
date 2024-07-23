"use client";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { markPostAsRead } from "@/app/(main)/questions/actions";
import { getComments } from "@/app/(main)/questions/actions";
import Comment from "@/components/comment_feed/comment";
import CommentEditor from "@/components/comment_feed/comment_editor";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { CommentPermissions, CommentType } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

type Props = {
  postId?: number;
  postPermissions?: ProjectPermissions;
  profileId?: number;
};

const CommentFeed: FC<Props> = ({ postId, postPermissions, profileId }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [feedSection, setFeedSection] = useState("public");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [shownComments, setShownComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setShownComments(
      comments.filter((comment) =>
        feedSection === "public" ? !comment.is_private : comment.is_private
      )
    );
  }, [comments, feedSection]);

  useEffect(() => {
    const fetchComments = async (url: string = "/comments") => {
      try {
        setIsLoading(true);
        const response = await getComments(url, {
          post: postId,
          author: profileId,
          parent_isnull: !!postId,
        });
        setComments(() => [...(response ? (response as CommentType[]) : [])]);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching comments:", err);
      } finally {
      }
    };

    void fetchComments();
  }, [postId, profileId]);

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

  const feedOptions: GroupButton<string>[] = [
    {
      value: "public",
      label: t("public"),
    },
    {
      value: "private",
      label: t("private"),
    },
  ];

  return (
    <section>
      <hr className="my-4" />
      <div className="my-4 flex flex-row gap-4">
        <h2
          className="mb-1 mt-0 flex scroll-mt-16 items-baseline justify-between capitalize break-anywhere"
          id="comment-section"
        >
          {t("comments")}
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
          <Comment
            onProfile={profileId ? true : false}
            comment={comment}
            url={url}
            permissions={permissions}
            treeDepth={0}
          />
        </div>
      ))}
      {isLoading && <LoadingIndicator className="mx-auto my-8 w-24" />}
      {comments.length == 0 && !isLoading && (
        <>
          <hr className="my-4" />
          <div className="text-center italic text-gray-700 dark:text-gray-700-dark">
            {t("noComments")}
          </div>
        </>
      )}
    </section>
  );
};

export default CommentFeed;
