"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import { markPostAsRead } from "@/app/(main)/questions/actions";
import { getComments } from "@/app/(main)/questions/actions";
import Comment from "@/components/comment_feed/comment";
import CommentEditor from "@/components/comment_feed/comment_editor";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { CommentPermissions, CommentType } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

import Button from "../ui/button";

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
  const [commentTotal, setCommentTotal] = useState<number | "?">("?");
  const [shownComments, setShownComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextPage, setNextPage] = useState<number | undefined>(undefined);

  useEffect(() => {
    setShownComments(
      comments.filter((comment) =>
        feedSection === "public" ? !comment.is_private : comment.is_private
      )
    );
  }, [comments, feedSection]);

  useEffect(() => {
    void fetchComments();
  }, [postId, profileId]);

  const fetchComments = useCallback(
    async (url: string = "/comments") => {
      try {
        setIsLoading(true);
        const response = await getComments(url, {
          post: postId,
          author: profileId,
          parent_isnull: !!postId,
          page: nextPage,
        });
        if ("errors" in response) {
          console.error("Error fetching comments:", response.errors);
          setCommentTotal(0);
        } else {
          setCommentTotal(0);
          /* this is wrong 
          if (response.count) {
            setCommentTotal(response.count);
          }
        */
          if (nextPage && nextPage > 1) {
            setComments((prevComments) => [
              ...prevComments,
              ...response.results,
            ]);
          } else {
            setComments(response.results);
          }
          if (response.next) {
            const nextPageNumber = new URL(response.next).searchParams.get(
              "page"
            );
            setNextPage(nextPageNumber ? Number(nextPageNumber) : undefined);
          } else {
            setNextPage(undefined);
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    },
    [postId, profileId, nextPage]
  );

  let permissions: CommentPermissions = CommentPermissions.VIEWER;
  if (
    postId &&
    (postPermissions === ProjectPermissions.ADMIN ||
      postPermissions === ProjectPermissions.CURATOR)
  ) {
    permissions = CommentPermissions.CURATOR;
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
  const isInProfile = !!profileId;

  return (
    <section>
      <hr className="my-4 border-blue-400 dark:border-blue-700" />
      <div className="my-4 flex flex-row items-center gap-4">
        <h2
          className="m-0 flex scroll-mt-16 items-baseline justify-between capitalize break-anywhere"
          id="comment-section"
        >
          {t("comments")}
        </h2>
        {!isInProfile && (
          <ButtonGroup
            value={feedSection}
            buttons={feedOptions}
            onChange={(selection) => {
              setFeedSection(selection);
            }}
            variant="tertiary"
          />
        )}
        <span> {commentTotal} comments </span>
      </div>
      {postId && <CommentEditor postId={postId} />}
      {shownComments.map((comment: CommentType) => (
        <div key={comment.id}>
          <hr className="my-4 border-blue-400 dark:border-blue-700" />
          {isInProfile && (
            <h3 className="mb-2 text-lg font-semibold">
              <Link
                href="#"
                className="text-blue-700 no-underline hover:text-blue-800 dark:text-blue-400 hover:dark:text-blue-300"
              >
                Question Title Comes Here
              </Link>
            </h3>
          )}
          <Comment
            onProfile={isInProfile}
            comment={comment}
            permissions={permissions}
            treeDepth={0}
          />
        </div>
      ))}
      {shownComments.length === 0 && !isLoading && (
        <>
          <hr className="my-4" />
          <div className="text-center italic text-gray-700 dark:text-gray-700-dark">
            {t("noComments")}
          </div>
        </>
      )}
      {isLoading && <LoadingIndicator className="mx-auto my-8 w-24" />}
      {nextPage && (
        <div className="flex items-center justify-center">
          <Button onClick={() => fetchComments()} disabled={isLoading}>
            {t("loadMoreComments")}
          </Button>
        </div>
      )}
    </section>
  );
};

export default CommentFeed;
