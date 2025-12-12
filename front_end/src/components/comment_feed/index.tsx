"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import {
  commentTogglePin,
  markPostAsRead,
} from "@/app/(main)/questions/actions";
import CommentEditor from "@/components/comment_feed/comment_editor";
import { DefaultUserMentionsContextProvider } from "@/components/markdown_editor/plugins/mentions/components/default_mentions_context";
import { MentionItem } from "@/components/markdown_editor/plugins/mentions/types";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import useHash from "@/hooks/use_hash";
import useScrollTo from "@/hooks/use_scroll_to";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { getCommentsParams } from "@/services/api/comments/comments.shared";
import { CommentType } from "@/types/comment";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { getCommentIdToFocusOn } from "@/utils/comments";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { getQuestionStatus } from "@/utils/questions/helpers";

import CommentWelcomeMessage, {
  getIsMessagePreviouslyClosed,
} from "./comment_welcome_message";
import { CommentWrapper } from "./comment_wrapper";
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

type Props = {
  postData?: PostWithForecasts;
  profileId?: number;
  rootCommentStructure?: boolean;
  id?: string;
  inNotebook?: boolean;
  showTitle?: boolean;
  compactVersion?: boolean;
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
    const latest = postData.question.my_forecasts?.latest;
    return !!latest && isForecastActive(latest);
  }

  return false;
}

const NEW_USER_COMMENT_LIMIT = 3;

const CommentFeed: FC<Props> = ({
  postData,
  profileId,
  id,
  inNotebook = false,
  showTitle = true,
  compactVersion = false,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const [userCommentsAmount, setUserCommentsAmount] = useState<number | null>(
    user ? NEW_USER_COMMENT_LIMIT : null
  );
  const isFirstRender = useRef(true);
  const scrollTo = useScrollTo();
  const commentsRef = useRef<HTMLDivElement>(null);
  const showWelcomeMessage =
    userCommentsAmount !== null &&
    userCommentsAmount < NEW_USER_COMMENT_LIMIT &&
    !PUBLIC_MINIMAL_UI;

  const { isDone } = getQuestionStatus(postData ?? null);

  const shouldSuggestKeyFactors =
    user?.should_suggest_keyfactors && !postData?.notebook && !isDone;

  const [userKeyFactorsComment, setUserKeyFactorsComment] =
    useState<CommentType | null>(null);

  const [feedFilters, setFeedFilters] = useState<getCommentsParams>(() => ({
    is_private: false,
    sort: "-created_at",
    focus_comment_id: getCommentIdToFocusOn() || undefined,
  }));

  const {
    comments,
    setComments,
    isLoading,
    setOffset,
    error,
    offset,
    totalCount,
    fetchComments,
    fetchTotalCount,
  } = useCommentsFeed();
  const postId = postData?.id;
  const includeUserForecast = shouldIncludeForecast(postData);

  const commentAuthorMentionItems: MentionItem[] = useMemo(
    () =>
      extractUniqueAuthors({
        authorId: postData?.author_id,
        authorUsername: postData?.author_username,
        coauthors: postData?.coauthors,
        comments,
      }),
    [comments, postData]
  );

  const { setBannerIsVisible } = useContentTranslatedBannerContext();

  useEffect(() => {
    if (comments.filter((c) => c.is_current_content_translated).length > 0) {
      setBannerIsVisible(true);
    }
  }, [comments, setBannerIsVisible]);

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
        // We want to reset focus comment in case of filters change
        focus_comment_id: undefined,
        [key]: value,
      });
    },
    [feedFilters, setComments, setOffset]
  );

  const hash = useHash();

  // Track #comment-id and #comments hash changes to load & focus on target comment
  useEffect(() => {
    if (hash) {
      const focus_comment_id = getCommentIdToFocusOn();
      if (
        focus_comment_id &&
        // Ensure we don't make duplicated calls
        focus_comment_id != feedFilters.focus_comment_id
      ) {
        setOffset(0);
        setFeedFilters({
          ...feedFilters,
          focus_comment_id,
        });
      } else if (hash === "comments" && isFirstRender.current && !isLoading) {
        isFirstRender.current = false;
        // same workaround as in comment.tsx
        const timeoutId = setTimeout(() => {
          if (commentsRef.current) {
            scrollTo(commentsRef.current.getBoundingClientRect().top);
          }
        }, 1000);

        return () => {
          clearTimeout(timeoutId);
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, isLoading]);

  // Handling filters change
  useEffect(() => {
    const finalFilters = {
      ...feedFilters,
      offset,
    };
    void fetchComments(true, finalFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedFilters]);

  useEffect(() => {
    // Fetch info about user comments amount
    const fetchUserComments = async (userId?: number) => {
      if (!userId) return;

      try {
        const response = await ClientCommentsApi.getComments({
          limit: 1,
          offset: 0,
          author: userId,
        });
        setUserCommentsAmount(response.total_count ?? response.count);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    };

    if (user?.id && postId) {
      fetchUserComments(user.id);
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
        (comment.children ?? []).forEach(countUnread);
      };

      comments.forEach(countUnread);
      return unreadCount;
    },
    [postData?.last_viewed_at]
  );

  const handleCommentPin = useCallback(
    async (comment: CommentType) => {
      const { is_pinned } = await commentTogglePin(
        comment.id,
        !comment.is_pinned
      );

      await fetchComments(false, { ...feedFilters, offset });

      setTimeout(() => {
        commentsRef.current?.scrollIntoView();
      }, 100);

      if (is_pinned) {
        toast(t("commentPinned"));
      } else {
        toast(t("commentUnpinned"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t]
  );

  const onNewComment = (newComment: CommentType) => {
    setComments([newComment, ...comments]);

    fetchTotalCount({
      is_private: feedFilters.is_private,
    });

    const isPostOpen = ![
      PostStatus.CLOSED,
      PostStatus.RESOLVED,
      PostStatus.PENDING_RESOLUTION,
    ].includes(postData?.status ?? PostStatus.CLOSED);

    if (postId && user?.should_suggest_keyfactors && isPostOpen) {
      setUserKeyFactorsComment(newComment);
    }
  };

  return (
    <DefaultUserMentionsContextProvider
      defaultUserMentions={commentAuthorMentionItems}
    >
      <section
        id={id}
        ref={commentsRef}
        className={cn(
          "max-w-full rounded text-gray-900 dark:text-gray-900-dark",
          {
            "mt-6 w-full px-0 md:px-3": inNotebook,
          },
          {
            "w-[48rem] border-transparent bg-gray-0 px-3 py-2 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark xs:px-4 lg:border":
              !inNotebook,
          },
          compactVersion && "p-0 xs:p-0"
        )}
      >
        {!compactVersion && (
          <div className="mb-4 mt-2 flex flex-col items-start gap-3">
            <div
              className={cn(
                "flex w-full flex-row justify-between gap-4 md:gap-3",
                {
                  "justify-center sm:justify-start": !showTitle,
                }
              )}
            >
              {showTitle && (
                <h2
                  className="m-0 flex scroll-mt-16 items-baseline justify-between capitalize break-anywhere"
                  id="comments"
                >
                  {t("comments")}
                </h2>
              )}
              {!profileId &&
                user &&
                // Private comments were deprecated in favor of Private Notes
                // Leaving for bots for backward compatibility
                user.is_bot &&
                (!showWelcomeMessage || getIsMessagePreviouslyClosed()) && (
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
            {postId && showWelcomeMessage && (
              <CommentWelcomeMessage
                onClick={() => {
                  setUserCommentsAmount(NEW_USER_COMMENT_LIMIT);
                }}
              />
            )}
          </div>
        )}
        {!compactVersion && postId && (
          <>
            {showWelcomeMessage && !getIsMessagePreviouslyClosed() ? null : (
              <CommentEditor
                shouldIncludeForecast={includeUserForecast}
                postId={postId}
                onSubmit={
                  //TODO: revisit after BE changes
                  (newComment) => {
                    onNewComment(newComment);
                  }
                }
                isPrivateFeed={feedFilters.is_private}
              />
            )}
          </>
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
          <CommentWrapper
            key={comment.id}
            comment={comment}
            handleCommentPin={handleCommentPin}
            profileId={profileId}
            last_viewed_at={postData?.last_viewed_at}
            postData={postData}
            suggestKeyFactorsOnFirstRender={
              // This is the newly added comment, so we want to suggest key factors
              comment.id === userKeyFactorsComment?.id
            }
            shouldSuggestKeyFactors={shouldSuggestKeyFactors}
          />
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
    </DefaultUserMentionsContextProvider>
  );
};

function extractUniqueAuthors({
  authorId,
  authorUsername,
  coauthors,
  comments,
}: {
  comments: CommentType[];
  authorId?: number;
  authorUsername?: string;
  coauthors?: { id: number; username: string }[];
}): MentionItem[] {
  const authorMap = new Map<number, string>();

  if (!isNil(authorId) && !isNil(authorUsername)) {
    authorMap.set(authorId, authorUsername);
  }

  if (!isNil(coauthors)) {
    for (const coauthor of coauthors) {
      authorMap.set(coauthor.id, coauthor.username);
    }
  }

  const traverseComments = (commentList: CommentType[]) => {
    for (const comment of commentList) {
      if (!authorMap.has(comment.author.id)) {
        authorMap.set(comment.author.id, comment.author.username);
      }
      const kids = comment.children ?? [];
      if (kids.length) traverseComments(kids);
    }
  };

  traverseComments(comments);

  return Array.from(authorMap.entries()).map(([userId, value]) => ({
    userId,
    value,
  }));
}

export default dynamic(() => Promise.resolve(CommentFeed), {
  ssr: false,
});
