import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import {
  addKeyFactorsToComment,
  createComment,
} from "@/app/(main)/questions/actions";
import { useServerAction } from "@/hooks/use_server_action";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { BECommentType, KeyFactor } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { sendAnalyticsEvent } from "@/utils/analytics";

const FACTORS_PER_QUESTION = 6;
const FACTORS_PER_COMMENT = 4;

export type SuggestedKeyFactor = {
  text: string;
  selected: boolean;
};

type UseKeyFactorsProps = {
  user_id: number | undefined;
  commentId?: number;
  postId?: number;
  suggestKeyFactors?: boolean;
  onKeyFactorsLoadded?: (success: boolean) => void;
};

export const useKeyFactors = ({
  user_id,
  commentId,
  postId,
  suggestKeyFactors: shouldLoadKeyFactors = false,
  onKeyFactorsLoadded,
}: UseKeyFactorsProps) => {
  const t = useTranslations();
  const { comments, setComments, combinedKeyFactors, setCombinedKeyFactors } =
    useCommentsFeed();

  const [keyFactors, setKeyFactors] = useState<string[]>([""]);
  const [errors, setErrors] = useState<ErrorResponse | undefined>();
  const [suggestedKeyFactors, setSuggestedKeyFactors] = useState<
    SuggestedKeyFactor[]
  >([]);
  const [isLoadingSuggestedKeyFactors, setIsLoadingSuggestedKeyFactors] =
    useState(false);

  useEffect(() => {
    if (shouldLoadKeyFactors && commentId) {
      setIsLoadingSuggestedKeyFactors(true);
      ClientCommentsApi.getSuggestedKeyFactors(commentId)
        .then((suggested) => {
          setSuggestedKeyFactors(
            suggested.map((text) => ({ text, selected: false }))
          );
          onKeyFactorsLoadded?.(suggested.length !== 0);
        })
        .catch(() => {
          onKeyFactorsLoadded?.(false);
        })
        .finally(() => {
          setIsLoadingSuggestedKeyFactors(false);
        });
    }
  }, [commentId, shouldLoadKeyFactors]);

  const { factorsLimit } = useMemo(
    () => getKeyFactorsLimits(combinedKeyFactors, user_id, commentId),
    [combinedKeyFactors, user_id, commentId]
  );

  const limitError = commentId
    ? factorsLimit <= 0
      ? t("maxKeyFactorsPerComment")
      : undefined
    : factorsLimit <= 0
      ? t("maxKeyFactorsPerQuestion")
      : undefined;

  const onSubmit = async (
    keyFactors: string[],
    suggestedKeyFactors: SuggestedKeyFactor[],
    markdown?: string
  ): Promise<
    | {
        errors: ErrorResponse;
        comment?: never;
      }
    | {
        error?: never;
        comment: BECommentType;
      }
  > => {
    for (const keyFactor of keyFactors) {
      if (keyFactor.trim().length > 150) {
        return { errors: new Error(t("maxKeyFactorLength")) };
      }
    }

    const filteredKeyFactors = keyFactors.filter((f) => f.trim() !== "");
    const filteredSuggestedKeyFactors = suggestedKeyFactors
      .filter((kf) => kf.selected)
      .map((kf) => kf.text);

    let comment;
    if (commentId) {
      comment = await addKeyFactorsToComment(commentId, [
        ...filteredKeyFactors,
        ...filteredSuggestedKeyFactors,
      ]);
    } else {
      comment = await createComment({
        on_post: postId,
        text: markdown || "",
        key_factors: [...filteredKeyFactors, ...filteredSuggestedKeyFactors],
        is_private: false,
      });
    }

    sendAnalyticsEvent("addKeyFactor", {
      event_label: isNil(commentId) ? "fromList" : "fromComment",
      event_category: "submit",
    });

    if ("errors" in comment) {
      return {
        errors: comment.errors as ErrorResponse,
      };
    }

    setCombinedKeyFactors([
      ...(comment.key_factors?.filter(
        (kf) => !combinedKeyFactors.some((existing) => existing.id === kf.id)
      ) ?? []),
      ...combinedKeyFactors,
    ]);

    if (!commentId) {
      setComments([{ ...comment, children: [] }, ...comments]);
    }
    return { comment };
  };

  const [submit, isPending] = useServerAction(onSubmit);

  const clearState = () => {
    setKeyFactors([""]);
    setErrors(undefined);
    setSuggestedKeyFactors([]);
  };

  return {
    keyFactors,
    setKeyFactors,
    errors,
    setErrors,
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,

    limitError,
    factorsLimit,

    submit,
    isPending,
    clearState,
  };
};

export const getKeyFactorsLimits = (
  combinedKeyFactors: KeyFactor[],
  user_id: number | undefined,
  commentId?: number
) => {
  if (isNil(user_id)) {
    return {
      userPostFactors: [],
      userCommentFactors: [],
      factorsLimit: 0,
    };
  }

  const postFactors = combinedKeyFactors.filter(
    (kf) => kf.author.id === user_id
  );
  const commentFactors = !isNil(commentId)
    ? combinedKeyFactors.filter((kf) => kf.comment_id === commentId)
    : [];

  const commentLimit = commentId
    ? FACTORS_PER_COMMENT - commentFactors.length
    : FACTORS_PER_COMMENT;
  const postLimit = FACTORS_PER_QUESTION - postFactors.length;

  const factorsLimit = Math.min(commentLimit, postLimit);

  return {
    userPostFactors: postFactors,
    userCommentFactors: commentFactors,
    factorsLimit,
  };
};
