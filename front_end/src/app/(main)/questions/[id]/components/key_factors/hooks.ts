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
import { KeyFactorWritePayload } from "@/services/api/comments/comments.shared";
import { BECommentType, Driver, KeyFactor } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { Target } from "./option_target_picker";

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
  target: Target;
};

export const useKeyFactors = ({
  user_id,
  commentId,
  postId,
  suggestKeyFactors: shouldLoadKeyFactors = false,
  onKeyFactorsLoadded,
  target,
}: UseKeyFactorsProps) => {
  const t = useTranslations();
  const { comments, setComments, combinedKeyFactors, setCombinedKeyFactors } =
    useCommentsFeed();

  const [keyFactors, setKeyFactors] = useState<Driver[]>([
    { text: "", impact_direction: 1, certainty: null },
  ]);
  const [errors, setErrors] = useState<ErrorResponse | undefined>();
  const [suggestedKeyFactors, setSuggestedKeyFactors] = useState<
    SuggestedKeyFactor[]
  >([]);
  const [isLoadingSuggestedKeyFactors, setIsLoadingSuggestedKeyFactors] =
    useState(false);

  const applyTarget = (p: KeyFactorWritePayload) =>
    target.kind === "question"
      ? { ...p, question_id: target.question_id }
      : target.kind === "option"
        ? {
            ...p,
            question_id: target.question_id,
            question_option: target.question_option,
          }
        : p;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    keyFactors: Driver[],
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
      if (keyFactor.text.trim().length > 150) {
        return { errors: new Error(t("maxKeyFactorLength")) };
      }
    }

    const filteredKeyFactors = keyFactors.filter((f) => f.text.trim() !== "");
    const filteredSuggestedKeyFactors = suggestedKeyFactors
      .filter((kf) => kf.selected)
      .map((kf) => kf.text);

    const writePayloads: KeyFactorWritePayload[] = [
      ...filteredKeyFactors.map((d) =>
        applyTarget({
          driver: toDriverUnion({
            text: d.text,
            impact_direction: d.impact_direction ?? null,
            certainty: d.certainty ?? null,
          }),
        })
      ),
      ...filteredSuggestedKeyFactors.map((text) =>
        applyTarget({
          driver: { text, impact_direction: 1, certainty: null },
        })
      ),
    ];

    let comment;
    if (commentId) {
      comment = await addKeyFactorsToComment(commentId, writePayloads);
    } else {
      comment = await createComment({
        on_post: postId,
        text: markdown || "",
        key_factors: writePayloads,
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
    setKeyFactors([{ text: "", impact_direction: 1, certainty: null }]);
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
  const FACTORS_PER_QUESTION = 6;
  const FACTORS_PER_COMMENT = 4;

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

type DriverDraft = {
  text: string;
  impact_direction: 1 | -1 | null;
  certainty: -1 | null;
};

function toDriverUnion(d: DriverDraft): Driver {
  if (d.certainty === -1) {
    return { text: d.text, impact_direction: null, certainty: -1 };
  }
  const dir = d.impact_direction;
  if (dir === 1 || dir === -1) {
    return { text: d.text, impact_direction: dir, certainty: null };
  }
  return { text: d.text, impact_direction: 1, certainty: null };
}
