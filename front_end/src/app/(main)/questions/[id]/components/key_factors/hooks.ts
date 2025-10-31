import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import {
  addKeyFactorsToComment,
  createComment,
  deleteKeyFactor as deleteKeyFactorAction,
  reportKeyFactorSpam,
} from "@/app/(main)/questions/actions";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { KeyFactorWritePayload } from "@/services/api/comments/comments.shared";
import { BECommentType, KeyFactor } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { KeyFactorDraft } from "@/types/key_factors";
import { sendAnalyticsEvent } from "@/utils/analytics";

type UseKeyFactorsProps = {
  user_id: number | undefined;
  commentId?: number;
  postId?: number;
  suggestKeyFactors?: boolean;
  onKeyFactorsLoaded?: (success: boolean) => void;
};

export const useKeyFactors = ({
  user_id,
  commentId,
  postId,
  suggestKeyFactors: shouldLoadKeyFactors = false,
  onKeyFactorsLoaded,
}: UseKeyFactorsProps) => {
  const t = useTranslations();
  const { comments, setComments, combinedKeyFactors, setCombinedKeyFactors } =
    useCommentsFeed();

  // The drafts are managed by the caller now
  const [errors, setErrors] = useState<ErrorResponse | undefined>();
  const [suggestedKeyFactors, setSuggestedKeyFactors] = useState<
    KeyFactorDraft[]
  >([]);
  const [isLoadingSuggestedKeyFactors, setIsLoadingSuggestedKeyFactors] =
    useState(false);

  const applyTargetForDraft = (
    draft: KeyFactorDraft,
    payload: KeyFactorWritePayload
  ): KeyFactorWritePayload => {
    if (draft.question_option) {
      return {
        ...payload,
        question_id: draft.question_id,
        question_option: draft.question_option,
      };
    }
    if (draft.question_id) {
      return { ...payload, question_id: draft.question_id };
    }
    return payload;
  };

  useEffect(() => {
    if (shouldLoadKeyFactors && commentId) {
      setIsLoadingSuggestedKeyFactors(true);
      ClientCommentsApi.getSuggestedKeyFactors(commentId)
        .then((drafts: KeyFactorWritePayload[]) => {
          setSuggestedKeyFactors(drafts);
          onKeyFactorsLoaded?.(drafts.length !== 0);
          if (drafts.length > 0) {
            setTimeout(() => {
              const el = document.getElementById("suggested-key-factors");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 50);
          }
        })
        .catch(() => {
          onKeyFactorsLoaded?.(false);
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
    submittedDrafts: KeyFactorDraft[],
    suggestedKeyFactors: KeyFactorDraft[],
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
    const filteredDrafts = submittedDrafts.filter(
      (d) => d.driver.text.trim() !== ""
    );
    const filteredSuggestedKeyFactors = suggestedKeyFactors.filter(
      (d) => d.driver.text.trim() !== ""
    );

    const writePayloads: KeyFactorWritePayload[] = [
      ...filteredDrafts.map((d) =>
        applyTargetForDraft(d, {
          driver: {
            text: d.driver.text,
            impact_direction: d.driver.impact_direction ?? null,
            certainty: d.driver.certainty ?? null,
          },
        })
      ),
      ...filteredSuggestedKeyFactors.map((d) =>
        applyTargetForDraft(d, {
          driver: {
            text: d.driver.text,
            impact_direction: d.driver.impact_direction ?? null,
            certainty: d.driver.certainty ?? null,
          },
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
    setErrors(undefined);
    setSuggestedKeyFactors([]);
  };

  return {
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

/**
 * Hook for deleting a key factor with confirmation modal.
 */
export const useKeyFactorDelete = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { combinedKeyFactors, setCombinedKeyFactors } = useCommentsFeed();

  const openDeleteModal = useCallback(
    async (keyFactorId: number) => {
      setCurrentModal({
        type: "confirm",
        data: {
          title: t("confirmDeletion"),
          description: t("confirmDeletionKeyFactorDescription"),
          onConfirm: async () => {
            const result = await deleteKeyFactorAction(keyFactorId);

            if (!result || !("errors" in result)) {
              setCombinedKeyFactors(
                combinedKeyFactors.filter((kf) => kf.id !== keyFactorId)
              );
            }
          },
        },
      });
    },
    [setCurrentModal, t, combinedKeyFactors, setCombinedKeyFactors]
  );

  return { openDeleteModal };
};

export const useKeyFactorModeration = () => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { combinedKeyFactors, setCombinedKeyFactors } = useCommentsFeed();

  const hideForMe = useCallback(
    (id: number) => {
      setCombinedKeyFactors(
        combinedKeyFactors.map((kf) =>
          kf.id === id ? ({ ...kf, flagged_by_me: true } as KeyFactor) : kf
        )
      );
    },
    [combinedKeyFactors, setCombinedKeyFactors]
  );

  const reportSpam = useCallback(
    (kf: KeyFactor) => {
      setCurrentModal({
        type: "confirm",
        data: {
          title: t("reportSpam"),
          description: t("reportSpamConfirmDescription"),
          actionText: t("sendReport"),
          onConfirm: async () => {
            await reportKeyFactorSpam();
            hideForMe(kf.id);
          },
        },
      });
    },
    [setCurrentModal, t, hideForMe]
  );

  const {
    optimisticallyAddReplyEnsuringParent,
    finalizeReply,
    removeTempReply,
  } = useCommentsFeed();

  const openDispute = useCallback(
    (kf: KeyFactor) => {
      setCurrentModal({
        type: "disputeKeyFactor",
        data: {
          keyFactorId: kf.id,
          parentCommentId: kf.comment_id,
          postId: kf.post.id,
          onOptimisticAdd: (text: string) =>
            optimisticallyAddReplyEnsuringParent(kf.comment_id, text),
          onFinalize: finalizeReply,
          onRemove: removeTempReply,
        },
      });
    },
    [
      setCurrentModal,
      optimisticallyAddReplyEnsuringParent,
      finalizeReply,
      removeTempReply,
    ]
  );

  return { reportSpam, openDispute };
};
