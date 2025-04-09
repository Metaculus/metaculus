"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { SortOption } from "@/components/comment_feed";
import { getCommentsParams } from "@/services/comments";
import { BECommentType, CommentType } from "@/types/comment";
import { parseComment } from "@/utils/comments";
import { logError } from "@/utils/errors";

import { getComments } from "../questions/actions";

type ErrorType = Error & { digest?: string };

export type CommentsFeedContextType = {
  comments: CommentType[];
  setComments: (comments: CommentType[]) => void;
  isLoading: boolean;
  setIsLoading: (isFeedLoading: boolean) => void;
  error: ErrorType | undefined;
  offset: number;
  setOffset: (offset: number) => void;
  totalCount: number | "?";
  setTotalCount: (totalCount: number) => void;
  sort: SortOption;
  setSort: (sort: SortOption) => void;
  fetchComments: (
    keepComments: boolean,
    params: getCommentsParams
  ) => Promise<void>;
};

const COMMENTS_PER_PAGE = 10;

export const CommentsFeedContext =
  createContext<CommentsFeedContextType | null>(null);

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
      const commentData = commentMap.get(comment.id);
      if (commentData) {
        rootComments.push(commentData);
      }
    } else {
      const parentComment = commentMap.get(comment.parent_id);
      const childComment = commentMap.get(comment.id);
      if (parentComment && childComment) {
        parentComment.children.push(childComment);
      }
    }
  });

  return rootComments;
}

type BaseProviderProps = {
  rootCommentStructure: boolean;
};
type PostProviderProps = {
  postId: number;
  profileId?: never;
};
type ProfileProviderProps = {
  profileId: number;
  postId?: never;
};

const CommentsFeedProvider: FC<
  PropsWithChildren<
    BaseProviderProps & (PostProviderProps | ProfileProviderProps)
  >
> = ({ children, postId, profileId, rootCommentStructure }) => {
  const [sort, setSort] = useState<SortOption>("created_at");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [totalCount, setTotalCount] = useState<number | "?">("?");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorType | undefined>(undefined);
  const [offset, setOffset] = useState<number>(0);

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
      if (!!response && "errors" in response) {
        logError(response.errors, "Error fetching comments:");
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

  return (
    <CommentsFeedContext.Provider
      value={{
        comments,
        setComments,
        isLoading,
        setIsLoading,
        setOffset,
        setTotalCount,
        error,
        offset,
        totalCount,
        sort,
        setSort,
        fetchComments,
      }}
    >
      {children}
    </CommentsFeedContext.Provider>
  );
};

export default CommentsFeedProvider;

export const useCommentsFeed = () => {
  const context = useContext(CommentsFeedContext);
  if (!context) {
    throw new Error(
      "useCommentsFeed must be used within a CommentsFeedProvider"
    );
  }

  return context;
};
