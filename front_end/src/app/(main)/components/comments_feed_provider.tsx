"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { SortOption } from "@/components/comment_feed";
import { useAuth } from "@/contexts/auth_context";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { getCommentsParams } from "@/services/api/comments/comments.shared";
import {
  BECommentType,
  CommentType,
  KeyFactor,
  KeyFactorVoteAggregate,
} from "@/types/comment";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { VoteDirection } from "@/types/votes";
import { parseComment } from "@/utils/comments";

type ErrorType = Error & { digest?: string };

export type CommentsFeedContextType = {
  comments: CommentType[];
  setComments: React.Dispatch<React.SetStateAction<CommentType[]>>;
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
  fetchTotalCount: (params: getCommentsParams) => Promise<void>;
  combinedKeyFactors: KeyFactor[];
  setCombinedKeyFactors: (combinedKeyFactors: KeyFactor[]) => void;
  setKeyFactorVote: (
    keyFactorId: number,
    aggregate: KeyFactorVoteAggregate
  ) => void;
  finalizeReply: (tempId: number, real: CommentType) => void;
  removeTempReply: (tempId: number) => void;
  optimisticallyAddReplyEnsuringParent: (
    parentId: number,
    text: string
  ) => Promise<number>;
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
  const { user } = useAuth();
  const [sort, setSort] = useState<SortOption>("created_at");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [totalCount, setTotalCount] = useState<number | "?">("?");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorType | undefined>(undefined);
  const [offset, setOffset] = useState<number>(0);

  const initialKeyFactors = [...(postData?.key_factors ?? [])].sort((a, b) =>
    b.vote?.score === a.vote?.score
      ? Math.random() - 0.5
      : (b.vote?.score || 0) - (a.vote?.score || 0)
  );
  const [combinedKeyFactors, setCombinedKeyFactors] =
    useState<KeyFactor[]>(initialKeyFactors);

  const setAndSortCombinedKeyFactors = (keyFactors: KeyFactor[]) => {
    const sortedKeyFactors = [...keyFactors].sort(
      (a, b) => (b.vote?.score || 0) - (a.vote?.score || 0)
    );
    setCombinedKeyFactors(sortedKeyFactors);
  };

  const setKeyFactorVote = (
    keyFactorId: number,
    aggregate: KeyFactorVoteAggregate
  ) => {
    // Update the list of combined key factors with the new vote
    const newKeyFactors = combinedKeyFactors.map((kf) =>
      kf.id === keyFactorId
        ? {
            ...kf,
            vote: aggregate,
          }
        : { ...kf }
    );

    setCombinedKeyFactors(newKeyFactors);

    //Update the comments state with the new vote for the key factor
    setComments((prevComments) => {
      return prevComments.map((comment) => {
        if (comment.key_factors?.some((kf) => kf.id === keyFactorId)) {
          return {
            ...comment,
            key_factors: comment.key_factors?.map((kf) =>
              kf.id === keyFactorId
                ? {
                    ...kf,
                    vote: aggregate,
                  }
                : kf
            ),
          };
        }
        return { ...comment };
      });
    });
  };

  const fetchTotalCount = async (params: getCommentsParams) => {
    try {
      const response = await ClientCommentsApi.getComments({
        post: postData?.id,
        author: profileId,
        limit: 1,
        use_root_comments_pagination: rootCommentStructure,
        ...params,
      });
      setTotalCount(response.total_count ?? response.count);
    } catch (err) {
      console.error("Error fetching total count:", err);
    }
  };

  const fetchComments = async (
    keepComments: boolean = true,
    params: getCommentsParams
  ) => {
    try {
      setIsLoading(true);
      setError(undefined);
      const response = await ClientCommentsApi.getComments({
        post: postData?.id,
        author: profileId,
        /* if we're on a post, fetch only parent comments with children annotated.  if this is a profile, fetch only the author's comments, including parents and children */
        limit: COMMENTS_PER_PAGE,
        use_root_comments_pagination: rootCommentStructure,
        ...params,
      });

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
    } catch (err) {
      const error = err as ErrorType;
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const optimisticallyAddReply = (parentId: number, text: string) => {
    const tempId = makeTempId();
    const nowIso = new Date().toISOString();

    const meAuthor = {
      id: user?.id ?? 0,
      username: user?.username ?? "me",
      is_bot: !!user?.is_bot,
      is_staff: !!user?.is_staff,
    };

    const beLike: BECommentType = {
      id: tempId,
      author: meAuthor,
      author_staff_permission: ProjectPermissions.VIEWER,
      on_post: postData?.id ?? 0,
      root_id: null,
      parent_id: parentId,
      created_at: nowIso,
      text_edited_at: nowIso,
      is_soft_deleted: false,
      text,
      is_private: false,
      vote_score: 0,
      user_vote: 0 as VoteDirection,
      changed_my_mind: { for_this_user: false, count: 0 },
      mentioned_users: [],
      is_pinned: false,
    };

    const temp: CommentType = { ...beLike, children: [] };
    setComments((prev) => insertChild(prev, parentId, temp));
    return tempId;
  };

  const finalizeReply = (tempId: number, real: CommentType) => {
    setComments((prev) => replaceById(prev, tempId, real));
  };

  const removeTempReply = (tempId: number) => {
    setComments((prev) => removeById(prev, tempId));
  };

  const ensureCommentLoaded = async (id: number): Promise<boolean> => {
    if (findById(comments, id)) {
      return true;
    }
    try {
      const response = await ClientCommentsApi.getComments({
        post: postData?.id,
        author: profileId,
        limit: COMMENTS_PER_PAGE,
        use_root_comments_pagination: rootCommentStructure,
        sort,
        focus_comment_id: String(id),
      });
      const focusedPage = parseCommentsArray(
        response.results as unknown as BECommentType[],
        rootCommentStructure
      );
      setComments((prev) => {
        const merged = [...focusedPage, ...prev].sort((a, b) => b.id - a.id);
        return uniqueById(merged);
      });
      if (typeof response.total_count === "number") {
        setTotalCount(response.total_count);
      }
      return true;
    } catch {
      return false;
    }
  };

  const optimisticallyAddReplyEnsuringParent = async (
    parentId: number,
    text: string
  ) => {
    findById(comments, parentId) || (await ensureCommentLoaded(parentId));
    const tempId = optimisticallyAddReply(parentId, text);
    return tempId;
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
        fetchTotalCount,
        combinedKeyFactors,
        setCombinedKeyFactors: setAndSortCombinedKeyFactors,
        setKeyFactorVote,
        finalizeReply,
        removeTempReply,
        optimisticallyAddReplyEnsuringParent,
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

function findById(list: CommentType[], id: number): CommentType | null {
  for (const c of list) {
    if (c.id === id) return c;
    const kids = c.children ?? [];
    if (kids.length) {
      const found = findById(kids, id);
      if (found) return found;
    }
  }
  return null;
}

function uniqueById(arr: CommentType[]): CommentType[] {
  const seen = new Set<number>();
  const out: CommentType[] = [];
  for (const c of arr) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

function mapTree(
  nodes: CommentType[],
  fn: (n: CommentType) => CommentType
): CommentType[] {
  return nodes.map((n) =>
    n.children?.length ? fn({ ...n, children: mapTree(n.children, fn) }) : fn(n)
  );
}

function replaceById(
  list: CommentType[],
  id: number,
  newNode: CommentType
): CommentType[] {
  return mapTree(list, (n) => (n.id === id ? newNode : n));
}

function removeById(list: CommentType[], id: number): CommentType[] {
  return list
    .map((n) =>
      n.children?.length ? { ...n, children: removeById(n.children, id) } : n
    )
    .filter((n) => n.id !== id);
}

function insertChild(
  list: CommentType[],
  parentId: number,
  child: CommentType
): CommentType[] {
  return mapTree(list, (n) =>
    n.id === parentId ? { ...n, children: [child, ...(n.children ?? [])] } : n
  );
}

function makeTempId(): number {
  return -Math.floor(Math.random() * 1e9 + Date.now());
}
