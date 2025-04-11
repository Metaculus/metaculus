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
import {
  BECommentType,
  CommentType,
  KeyFactor,
  KeyFactorVote,
} from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
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
  combinedKeyFactors: KeyFactor[];
  setCombinedKeyFactors: (combinedKeyFactors: KeyFactor[]) => void;
  setKeyFactorVote: (
    keyFactorId: number,
    keyFactorVote: KeyFactorVote,
    votesScore: number
  ) => void;
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
  postData: PostWithForecasts;
  profileId?: never;
};
type ProfileProviderProps = {
  profileId: number;
  postData?: never;
};

const CommentsFeedProvider: FC<
  PropsWithChildren<
    BaseProviderProps & (PostProviderProps | ProfileProviderProps)
  >
> = ({ children, postData, profileId, rootCommentStructure }) => {
  const [sort, setSort] = useState<SortOption>("created_at");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [totalCount, setTotalCount] = useState<number | "?">("?");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorType | undefined>(undefined);
  const [offset, setOffset] = useState<number>(0);

  const initialKeyFactors = (postData?.key_factors ?? []).sort((a, b) =>
    b.votes_score === a.votes_score
      ? Math.random() - 0.5
      : b.votes_score - a.votes_score
  );

  const [combinedKeyFactors, setCombinedKeyFactors] =
    useState<KeyFactor[]>(initialKeyFactors);

  const setAndSortCombinedKeyFactors = (keyFactors: KeyFactor[]) => {
    const sortedKeyFactors = keyFactors.sort(
      (a, b) => b.votes_score - a.votes_score
    );
    setCombinedKeyFactors(sortedKeyFactors);
  };

  const setKeyFactorVote = (
    keyFactorId: number,
    keyFactorVote: KeyFactorVote,
    votes_score: number
  ) => {
    // Update the list of combined key factors with the new vote
    setAndSortCombinedKeyFactors(
      combinedKeyFactors.map((kf) =>
        kf.id === keyFactorId
          ? {
              ...kf,
              votes_score,
              user_votes: [
                ...kf.user_votes.filter(
                  (vote) => vote.vote_type !== keyFactorVote.vote_type
                ),
                keyFactorVote,
              ],
            }
          : { ...kf }
      )
    );

    //Update the comments state with the new vote for the key factor
    setComments((prevComments) => {
      return prevComments.map((comment) => {
        // Check if this comment has the key factor we're updating
        if (comment.key_factors?.some((kf) => kf.id === keyFactorId)) {
          // Create a new comment object with updated key factors
          return {
            ...comment,
            key_factors: comment.key_factors?.map((kf) =>
              kf.id === keyFactorId
                ? {
                    ...kf,
                    votes_score,
                    user_votes: [
                      ...kf.user_votes.filter(
                        (vote) => vote.vote_type !== keyFactorVote.vote_type
                      ),
                      keyFactorVote,
                    ],
                  }
                : kf
            ),
          };
        }
        // Return unchanged comment if it doesn't have the key factor
        return { ...comment };
      });
    });
  };

  const fetchComments = async (
    keepComments: boolean = true,
    params: getCommentsParams
  ) => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await getComments({
        post: postData?.id,
        author: profileId,
        /* if we're on a post, fetch only parent comments with children annotated.  if this is a profile, fetch only the author's comments, including parents and children */
        limit: COMMENTS_PER_PAGE,
        use_root_comments_pagination: rootCommentStructure,
        ...params,
      });
      if ("errors" in response) {
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
        combinedKeyFactors,
        setCombinedKeyFactors: setAndSortCombinedKeyFactors,
        setKeyFactorVote,
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
