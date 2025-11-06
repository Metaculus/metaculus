import { PropsWithChildren } from "react";

import { CommentsFeedContext } from "@/app/(main)/components/comments_feed_provider";

export const MockCommentsFeedProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <CommentsFeedContext.Provider
      value={{
        comments: [],
        setComments: () => {},
        isLoading: false,
        setIsLoading: () => {},
        error: undefined,
        offset: -1,
        setOffset: () => {},
        totalCount: 0,
        setTotalCount: () => {},
        sort: "created_at",
        setSort: () => {},
        fetchComments: async () => {},
        fetchTotalCount: async () => {},
        combinedKeyFactors: [],
        setCombinedKeyFactors: () => {},
        setKeyFactorVote: () => {},
        finalizeReply: () => {},
        optimisticallyAddReplyEnsuringParent: async () => 0,
        removeTempReply: () => {},
      }}
    >
      {children}
    </CommentsFeedContext.Provider>
  );
};
