"use client";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { markPostAsRead } from "@/app/(main)/questions/actions";
import { getComments } from "@/app/(main)/questions/actions";
import Comment from "@/components/comment_feed/comment";
import CommentEditor from "@/components/comment_feed/comment_editor";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { CommentPermissions, CommentType } from "@/types/comment";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";

import Button from "../ui/button";

export type SortOption = "-created_at" | "-vote_score";
type FeedOptions = "public" | "private";

export function sortComments(comments: CommentType[], sort: SortOption) {
  comments.sort((a, b) => {
    switch (sort) {
      case "-created_at":
        return Number(b.created_at) - Number(a.created_at);
      case "-vote_score":
        return (b.vote_score ?? 0) - (a.vote_score ?? 0);
      default:
        // error
        return a.id - b.id;
    }
  });
}

type Props = {
  postData?: PostWithForecasts;
  postPermissions?: ProjectPermissions;
  profileId?: number;
};

const CommentFeed: FC<Props> = ({ postData, postPermissions, profileId }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [feedSection, setFeedSection] = useState<FeedOptions>("public");
  const [sort, setSort] = useState<SortOption>("-created_at");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [totalCount, setTotalCount] = useState<number | "?">("?");
  const [shownComments, setShownComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextPage, setNextPage] = useState<number>(1);
  const postId = postData?.id

  function handleSortChange(newSort: SortOption) {
    if (newSort === sort) {
      return null;
    }
    setNextPage(1);
    setSort(newSort);
    setComments([]);
    fetchComments("/comments", newSort, 1, false);
  }

  useEffect(() => {
    setShownComments(
      comments.filter((comment) =>
        feedSection === "public" ? !comment.is_private : comment.is_private
      )
    );
  }, [comments, feedSection]);

  const fetchComments = async (
    url: string = "/comments",
    commentSort: SortOption = sort,
    page = nextPage,
    keepComments = true
  ) => {
    try {
      setIsLoading(true);
      const response = await getComments(url, {
        post: postId,
        author: profileId,
        /* if we're on a post, fetch only parent comments with children annotated.  if this is a profile, fetch only the author's comments, including parents and children */
        parent_isnull: !!postId,
        page: page,
        sort: commentSort,
      });
      if ("errors" in response) {
        console.error("Error fetching comments:", response.errors);
      } else {
        setTotalCount(response.total_count);

        const sortedComments = response.results;
        sortComments(sortedComments, commentSort);

        if (keepComments && page && page > 1) {
          setComments((prevComments) => [...prevComments, ...sortedComments]);
        } else {
          setComments(sortedComments);
        }
        if (response.next) {
          const nextPageNumber = new URL(response.next).searchParams.get(
            "page"
          );
          setNextPage(nextPageNumber ? Number(nextPageNumber) : 1);
        } else {
          setNextPage(1);
        }
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  useEffect(() => {
    void fetchComments();
  }, []);

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

  const feedOptions: GroupButton<FeedOptions>[] = [
    {
      value: "public",
      label: t("public"),
    },
    {
      value: "private",
      label: t("private"),
    },
  ];

  const menuItems: MenuItemProps[] = [
    {
      id: "-created_at",
      name: t("recent"),
      onClick: () => {
        handleSortChange("-created_at");
      },
    },
    {
      id: "-vote_score",
      name: t("best"),
      onClick: () => {
        handleSortChange("-vote_score");
      },
    },
  ];

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
        {profileId && (
          <ButtonGroup
            value={feedSection}
            buttons={feedOptions}
            onChange={(selection) => {
              setFeedSection(selection);
            }}
            variant="tertiary"
          />
        )}
        <DropdownMenu items={menuItems}>
          <Button variant="text">
            {menuItems.find((item) => item.id === sort)?.name ?? "sort"}
            <FontAwesomeIcon icon={faChevronDown} />
          </Button>
        </DropdownMenu>
        <span>{totalCount} comments</span>
      </div>
      {postId && <CommentEditor postId={postId} />}
      {shownComments.map((comment: CommentType) => (
        <div key={comment.id}>
          <hr className="my-4 border-blue-400 dark:border-blue-700" />
          {profileId && (
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
            onProfile={!!profileId}
            comment={comment}
            permissions={permissions}
            treeDepth={0}
            sort={sort}
            postData={postData}
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
