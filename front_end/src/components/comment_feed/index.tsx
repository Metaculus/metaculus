"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
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
import { useContentTranslatedBannerProvider } from "@/app/providers";

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
  inNotebook?: boolean;
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
  inNotebook = false,
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

  const { setBannerisVisible } = useContentTranslatedBannerProvider();

  useEffect(() => {
    if (comments.filter((c) => c.is_current_content_translated).length > 0) {
      setBannerisVisible(true);
    }
  }, [comments, setBannerisVisible]);

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

  const getUnreadCount = useCallback(
    (comments: CommentType[]): number => {
      if (!postData?.last_viewed_at) return 0;
      const lastViewedDate = new Date(postData.last_viewed_at);

      let unreadCount = 0;
      const countUnread = (comment: CommentType) => {
        if (new Date(comment.created_at) > lastViewedDate) {
          unreadCount++;
        }
        // Count unread replies too
        comment.children.forEach(countUnread);
      };

      comments.forEach(countUnread);
      return unreadCount;
    },
    [postData?.last_viewed_at]
  );

  return (
    <section
      id={id}
      className={classNames(
        "max-w-full text-gray-900 dark:text-gray-900-dark",
        {
          "mt-6 w-full px-0 md:px-3": inNotebook,
        },
        {
          "w-[48rem] border-transparent bg-gray-0 px-3 py-2 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark xs:px-4 lg:border":
            !inNotebook,
        }
      )}
    >
      <div className="mb-4 mt-2 flex flex-col items-start gap-2">
        <div className="flex w-full flex-row justify-between gap-4 md:gap-3">
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
        </div>
      </div>
      {postId && (
        <CommentEditor
          shouldIncludeForecast={includeUserForecast}
          postId={postId}
          onSubmit={
            //TODO: revisit after BE changes
            (newComment) =>
              setComments((prevComments) => [newComment, ...prevComments])
          }
          isPrivateFeed={feedFilters.is_private}
        />
      )}

      <div className="mb-1 mt-3 flex flex-row items-center justify-start gap-1">
        <span className="text-sm text-gray-600 dark:text-gray-600-dark">
          {totalCount ? `${totalCount} ` : ""}
          {t("commentsWithCount", { count: totalCount })}
          {postData?.last_viewed_at && (
            <>
              {getUnreadCount(comments) > 0 && (
                <span className="ml-1 font-bold text-purple-700 dark:text-purple-700-dark">
                  ({getUnreadCount(comments)} {t("unread")})
                </span>
              )}
            </>
          )}
        </span>
        <DropdownMenu items={menuItems} itemClassName={"capitalize"}>
          <Button variant="text" className="capitalize">
            {menuItems.find((item) => item.id === feedFilters.sort)?.name ??
              "sort"}
            <FontAwesomeIcon icon={faChevronDown} />
          </Button>
        </DropdownMenu>
      </div>
      {comments.map((comment: CommentType) => (
        <div
          key={comment.id}
          className={classNames(
            "my-1.5 rounded-md border px-1.5 py-1 md:px-2.5 md:py-1.5",
            {
              "border-blue-400 dark:border-blue-400-dark": !(
                postData?.last_viewed_at &&
                new Date(postData.last_viewed_at) < new Date(comment.created_at)
              ),
              "border-purple-500 bg-purple-100/50 dark:border-purple-500-dark/60 dark:bg-purple-100-dark/50":
                postData?.last_viewed_at &&
                new Date(postData.last_viewed_at) <
                  new Date(comment.created_at),
            }
          )}
        >
          {profileId && comment.on_post_data && (
            <h3 className="mb-2 text-lg font-semibold">
              <Link
                href={`/questions/${comment.on_post_data.id}#comment-${comment.id}`}
                className="text-blue-700 no-underline hover:text-blue-800 dark:text-blue-600-dark hover:dark:text-blue-300"
              >
                {comment.on_post_data.title}
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
