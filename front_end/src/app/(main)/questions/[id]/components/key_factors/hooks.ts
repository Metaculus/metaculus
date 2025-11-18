import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import {
  addKeyFactorsToComment,
  createComment,
  deleteKeyFactor as deleteKeyFactorAction,
  reportKeyFactor,
} from "@/app/(main)/questions/actions";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { KeyFactorWritePayload } from "@/services/api/comments/comments.shared";
import { BECommentType, KeyFactor } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { KeyFactorDraft } from "@/types/key_factors";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { isBaseRateDraft, isDriverDraft } from "@/utils/key_factors";

import { coerceBaseForType } from "./item_creation/base_rate/utils";

type UseKeyFactorsProps = {
  user_id: number | undefined;
  commentId?: number;
  postId?: number;
  suggestKeyFactors?: boolean;
};

export const useKeyFactors = ({
  user_id,
  commentId,
  postId,
  suggestKeyFactors: shouldLoadKeyFactors = false,
}: UseKeyFactorsProps) => {
  const t = useTranslations();
  const { comments, setComments, combinedKeyFactors, setCombinedKeyFactors } =
    useCommentsFeed();

  // The drafts are managed by the caller now
  const [errors, setErrors] = useState<ErrorResponse | undefined>();
  const [suggestedKeyFactors, setSuggestedKeyFactors] = useState<
    KeyFactorDraft[]
  >([]);
  const fetchedOnceRef = useRef<Set<number>>(new Set());
  const inFlightRef = useRef<Record<number, boolean>>({});
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

  const fetchSuggestions = useCallback(async (cid: number) => {
    if (inFlightRef.current[cid]) return;
    inFlightRef.current[cid] = true;
    setIsLoadingSuggestedKeyFactors(true);
    try {
      const drafts = await ClientCommentsApi.getSuggestedKeyFactors(cid);
      setSuggestedKeyFactors(drafts);
      if (drafts.length > 0) {
        setTimeout(() => {
          const el = document.getElementById("suggested-key-factors");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }
      fetchedOnceRef.current.add(cid);
    } finally {
      setIsLoadingSuggestedKeyFactors(false);
      delete inFlightRef.current[cid];
    }
  }, []);

  useEffect(() => {
    if (!shouldLoadKeyFactors || !commentId) return;
    if (fetchedOnceRef.current.has(commentId)) return;
    void fetchSuggestions(commentId);
  }, [commentId, shouldLoadKeyFactors, fetchSuggestions]);

  const reloadSuggestions = useCallback(() => {
    if (!commentId) return;
    setSuggestedKeyFactors([]);
    fetchedOnceRef.current.delete(commentId);
    void fetchSuggestions(commentId);
  }, [commentId, fetchSuggestions]);

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
    suggested: KeyFactorDraft[],
    submitType: "driver" | "base_rate",
    markdown?: string
  ): Promise<
    | { errors: ErrorResponse; comment?: never }
    | { error?: never; comment: BECommentType }
  > => {
    const driverDrafts = submittedDrafts.filter(isDriverDraft);
    const baseRateDrafts = submittedDrafts.filter(isBaseRateDraft);
    const suggestedDriverDrafts = suggested.filter(isDriverDraft);
    const suggestedBaseRateDrafts = suggested.filter(isBaseRateDraft);

    const finalDrivers =
      submitType === "driver"
        ? [...driverDrafts, ...suggestedDriverDrafts].filter(
            (d) => d.driver.text.trim() !== ""
          )
        : [];

    const finalBaseRates =
      submitType === "base_rate"
        ? [...baseRateDrafts, ...suggestedBaseRateDrafts]
        : [];

    const driverPayloads: KeyFactorWritePayload[] = finalDrivers.map((d) =>
      applyTargetForDraft(d, {
        driver: {
          text: d.driver.text,
          impact_direction: d.driver.impact_direction ?? null,
          certainty: d.driver.certainty ?? null,
        },
      })
    );

    const baseRatePayloads: KeyFactorWritePayload[] = finalBaseRates.map((d) =>
      applyTargetForDraft(d, {
        base_rate: coerceBaseForType(d),
      })
    );

    const writePayloads = [...driverPayloads, ...baseRatePayloads];

    const comment = commentId
      ? await addKeyFactorsToComment(commentId, writePayloads)
      : await createComment({
          on_post: postId,
          text: markdown || "",
          key_factors: writePayloads,
          is_private: false,
        });

    sendAnalyticsEvent("addKeyFactor", {
      event_label: isNil(commentId) ? "fromList" : "fromComment",
      event_category: "submit",
    });

    if ("errors" in comment) {
      return { errors: comment.errors as ErrorResponse };
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

  const addSingleSuggestedKeyFactor = async (
    draft: KeyFactorDraft
  ): Promise<
    | { errors: ErrorResponse; comment?: never }
    | { error?: never; comment: BECommentType }
    | undefined
  > => {
    const submitType: "driver" | "base_rate" = isDriverDraft(draft)
      ? "driver"
      : "base_rate";

    const res = await onSubmit([draft], [], submitType);

    if (res && "errors" in res && res.errors) {
      setErrors(res.errors as ErrorResponse);
    }
    return res;
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
    reloadSuggestions,
    addSingleSuggestedKeyFactor,
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
  const [doReportKeyFactor] = useServerAction(reportKeyFactor);

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
            hideForMe(kf.id);
            await doReportKeyFactor(kf.id, "spam");
          },
        },
      });
    },
    [setCurrentModal, t, hideForMe, doReportKeyFactor]
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
