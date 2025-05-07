import { useState, useEffect, useMemo } from "react";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import {
  addKeyFactorsToComment,
  createComment,
  getSuggestedKeyFactors,
} from "@/app/(main)/questions/actions";
import { useServerAction } from "@/hooks/use_server_action";
import { BECommentType, KeyFactor } from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";

const FACTORS_PER_QUESTION = 6;
const FACTORS_PER_COMMENT = 4;

export type SuggestedKeyFactor = {
  text: string;
  selected: boolean;
};

type UseKeyFactorsProps = {
  user_id: number;
  commentId?: number;
  postId?: number;
  showSuggestedKeyFactors?: boolean;
  shouldLoadKeyFactors?: boolean;
};

export const useKeyFactors = ({
  user_id,
  commentId,
  postId,
  showSuggestedKeyFactors,
  shouldLoadKeyFactors = false,
}: UseKeyFactorsProps) => {
  const t = useTranslations();
  const { comments, setComments, combinedKeyFactors, setCombinedKeyFactors } =
    useCommentsFeed();

  const [keyFactors, setKeyFactors] = useState<string[]>([""]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [suggestedKeyFactors, setSuggestedKeyFactors] = useState<
    SuggestedKeyFactor[]
  >([]);
  const [isLoadingSuggestedKeyFactors, setIsLoadingSuggestedKeyFactors] =
    useState(false);

  useEffect(() => {
    if (showSuggestedKeyFactors && commentId) {
      setIsLoadingSuggestedKeyFactors(true);
      getSuggestedKeyFactors(commentId)
        .then((suggested) => {
          setSuggestedKeyFactors(
            suggested.map((text) => ({ text, selected: false }))
          );
        })
        .finally(() => {
          setIsLoadingSuggestedKeyFactors(false);
        });
    }
  }, [showSuggestedKeyFactors, commentId]);

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
        error: string;
        comment?: never;
      }
    | {
        error?: never;
        comment: BECommentType;
      }
  > => {
    for (const keyFactor of keyFactors) {
      if (keyFactor.trim().length > 150) {
        return { error: t("maxKeyFactorLength") };
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
      const errors = comment.errors;
      return {
        error:
          errors?.message ??
          errors?.non_field_errors?.[0] ??
          "" + comment.errors,
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
    setErrorMessage(undefined);
  };

  return {
    keyFactors,
    setKeyFactors,
    errorMessage,
    setErrorMessage,
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
  user_id: number,
  commentId?: number
) => {
  const postFactors = combinedKeyFactors.filter(
    (kf) => kf.author.id === user_id
  );
  const commentFactors = !isNil(commentId)
    ? combinedKeyFactors.filter((kf) => kf.comment_id === commentId)
    : [];

  const factorsLimit = commentId
    ? FACTORS_PER_COMMENT - commentFactors.length
    : FACTORS_PER_QUESTION - postFactors.length;

  return {
    userPostFactors: postFactors,
    userCommentFactors: commentFactors,
    factorsLimit,
  };
};
