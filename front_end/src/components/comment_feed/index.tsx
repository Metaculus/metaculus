"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useState } from "react";

import { getComments, markPostAsRead } from "@/app/(main)/questions/actions";
import Comment from "@/components/comment_feed/comment";
import CommentEditor from "@/components/comment_feed/comment_editor";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { getCommentsParams } from "@/services/comments";
import { BECommentType, CommentType } from "@/types/comment";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { QuestionType } from "@/types/question";
import { parseComment } from "@/utils/comments";
import { logError } from "@/utils/errors";

import Button from "../ui/button";
import { FormErrorMessage } from "../ui/form_field";

export type SortOption = "created_at" | "-created_at" | "-vote_score";
type FeedOptions = "public" | "private";

export function sortComments(comments: CommentType[], sort: SortOption) {
  comments.sort((a, b) => {
    switch (sort) {
      case "created_at":
        return Number(new Date(a.created_at)) - Number(new Date(b.created_at));
      case "-created_at":
        return Number(new Date(b.created_at)) - Number(new Date(a.created_at));
      case "-vote_score":
        return (b.vote_score ?? 0) - (a.vote_score ?? 0);
      default:
        // error
        return a.id - b.id;
    }
  });
  return comments;
}

function parseCommentsArray(
  beComments: BECommentType[],
  rootsOnly: boolean = true
): CommentType[] {
  const commentMap = new Map<number, CommentType>();

  beComments.forEach((comment) => {
    commentMap.set(comment.id, parseComment(comment));
  });

  if (!rootsOnly) {
    return Array.from(commentMap.values());
  }

  const rootComments: CommentType[] = [];

  beComments.forEach((comment) => {
    if (comment.parent_id === null) {
      rootComments.push(commentMap.get(comment.id)!);
    } else {
      const parentComment = commentMap.get(comment.parent_id);
      if (parentComment) {
        parentComment.children.push(commentMap.get(comment.id)!);
      }
    }
  });

  return rootComments;
}

type Props = {
  postData?: PostWithForecasts;
  postPermissions?: ProjectPermissions;
  profileId?: number;
  rootCommentStructure?: boolean;
  id?: string;
};

function shouldIncludeForecast(postData: PostWithForecasts | undefined) {
  if (postData === undefined) return false;

  // disable forecasts for notebooks
  if (postData.notebook !== undefined) {
    return false;
  }

  // we can link forecast only for date, binary and numeric questions
  if (postData.question) {
    if (postData.question.type === QuestionType.MultipleChoice) {
      return false;
    }

    return !!postData.question.my_forecasts?.history.length;
  }

  return false;
}

const COMMENTS_PER_PAGE = 10;

const CommentFeed: FC<Props> = ({
  postData,
  postPermissions,
  profileId,
  rootCommentStructure = true,
  id,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [feedFilters, setFeedFilters] = useState<getCommentsParams>(() => ({
    is_private: false,
    sort: "-created_at",
  }));

  const [comments, setComments] = useState<CommentType[]>([]);
  const [totalCount, setTotalCount] = useState<number | "?">("?");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const [offset, setOffset] = useState<number>(0);
  const postId = postData?.id;
  const includeUserForecast = shouldIncludeForecast(postData);

  const handleFilterChange = useCallback(
    (
      key: keyof getCommentsParams,
      value: getCommentsParams[keyof getCommentsParams],
      forceUpdate: boolean = false,
      resetComments: boolean = true
    ) => {
      if (!forceUpdate && feedFilters[key] === value) return;
      if (resetComments) setComments([]);

      setOffset(0);
      setFeedFilters({
        ...feedFilters,
        [key]: value,
      });
    },
    [feedFilters]
  );

  const fetchComments = async (
    keepComments: boolean = true,
    params: getCommentsParams
  ) => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await getComments({
        post: postId,
        author: profileId,
        /* if we're on a post, fetch only parent comments with children annotated.  if this is a profile, fetch only the author's comments, including parents and children */
        limit: COMMENTS_PER_PAGE,
        use_root_comments_pagination: rootCommentStructure,
        ...params,
      });
      if ("errors" in response) {
        console.error("Error fetching comments:", response.errors);
      } else {
        setTotalCount(response.total_count ?? response.count);

        const sortedComments = parseCommentsArray(
          response.results as unknown as BECommentType[],
          rootCommentStructure
        );
        if (keepComments && offset > 0) {
          setComments((prevComments) => [...prevComments, ...sortedComments]);
        } else {
          setComments(sortedComments);
        }
        if (response.next) {
          const nextOffset = new URL(response.next).searchParams.get("offset");
          setOffset(
            nextOffset ? Number(nextOffset) : (prev) => prev + COMMENTS_PER_PAGE
          );
        } else {
          setOffset(-1);
        }
      }
    } catch (err) {
      const error = err as Error & { digest?: string };
      setError(error);
      logError(err, `Error fetching comments: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handling filters change
  useEffect(() => {
    let finalFilters = {
      ...feedFilters,
      offset,
    };

    if (isInitialRender && window.location.hash) {
      const match = window.location.hash.match(/#comment-(\d+)/);
      finalFilters.focus_comment_id = match ? match[1] : undefined;
    }

    setIsInitialRender(false);
    void fetchComments(true, finalFilters);
  }, [feedFilters]);

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
        handleFilterChange("sort", "-created_at");
      },
    },
    {
      id: "created_at",
      name: t("oldest"),
      onClick: () => {
        handleFilterChange("sort", "created_at");
      },
    },
    {
      id: "-vote_score",
      name: t("best"),
      onClick: () => {
        handleFilterChange("sort", "-vote_score");
      },
    },
  ];

  return (
    <section id={id}>
      <hr className="my-2 border-blue-400 dark:border-blue-400-dark" />
      <div className="my-2 flex flex-row flex-wrap items-center gap-4">
        <h2
          className="m-0 flex scroll-mt-16 items-baseline justify-between capitalize break-anywhere"
          id="comments"
        >
          {t("comments")}
        </h2>
        {!profileId && user && (
          <ButtonGroup
            value={feedFilters.is_private ? "private" : "public"}
            buttons={feedOptions}
            onChange={(section) => {
              handleFilterChange("is_private", section === "private");
            }}
            variant="tertiary"
          />
        )}
        <DropdownMenu items={menuItems} itemClassName={"capitalize"}>
          <Button variant="text" className="capitalize">
            {menuItems.find((item) => item.id === feedFilters.sort)?.name ??
              "sort"}
            <FontAwesomeIcon icon={faChevronDown} />
          </Button>
        </DropdownMenu>
        <span>
          {totalCount ? `${totalCount} ` : ""}
          {t("commentsWithCount", { count: totalCount })}
        </span>
      </div>
      {postId && (
        <CommentEditor
          shouldIncludeForecast={includeUserForecast}
          postId={postId}
          onSubmit={() =>
            handleFilterChange("sort", "-created_at", true, false)
          }
        />
      )}
      {comments.map((comment: CommentType) => (
        <div
          key={comment.id}
          className="my-1.5 rounded-md border border-blue-400 px-2.5 py-1.5 dark:border-blue-400-dark"
        >
          {profileId && (
            <h3 className="mb-2 text-lg font-semibold">
              <Link
                href={`/questions/${comment.on_post}#comment-${comment.id}`}
                className="text-blue-700 no-underline hover:text-blue-800 dark:text-blue-600-dark hover:dark:text-blue-300"
              >
                Go to question
              </Link>
            </h3>
          )}
          <Comment
            onProfile={!!profileId}
            comment={comment}
            treeDepth={0}
            /* replies should always be sorted from oldest to newest */
            sort={"created_at" as SortOption}
            postData={postData}
            lastViewedAt={postData?.last_viewed_at}
          />
        </div>
      ))}
      {comments.length === 0 && !isLoading && (
        <>
          <hr className="my-4" />
          <div className="text-center italic text-gray-700 dark:text-gray-700-dark">
            {t("noComments")}
          </div>
        </>
      )}
      {isLoading && <LoadingIndicator className="mx-auto my-8 w-24" />}
      {!isLoading && <FormErrorMessage errors={error?.digest} />}
      {offset !== -1 && (
        <div className="flex items-center justify-center pt-4">
          <Button
            onClick={() => fetchComments(true, { ...feedFilters, offset })}
            disabled={isLoading}
          >
            {t("loadMoreComments")}
          </Button>
        </div>
      )}
    </section>
  );
};

export default CommentFeed;
