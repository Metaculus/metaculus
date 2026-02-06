import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
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
import { Question } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import {
  isBaseRateDraft,
  isDriverDraft,
  isNewsDraft,
} from "@/utils/key_factors";

import { coerceBaseForType } from "./item_creation/base_rate/utils";
import { fetchNewsPreview } from "./utils";
import {
  extractQuestionNumbersFromText,
  fetchQuestionsForIds,
} from "../../../helpers/question_link_detection";

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

  const { coherenceLinks, aggregateCoherenceLinks } =
    useCoherenceLinksContext();

  // The drafts are managed by the caller now
  const [errors, setErrors] = useState<ErrorResponse | undefined>();
  const [suggestedKeyFactors, setSuggestedKeyFactors] = useState<
    KeyFactorDraft[]
  >([]);
  const fetchedOnceRef = useRef<Set<number>>(new Set());
  const inFlightRef = useRef<Record<number, boolean>>({});
  const [isLoadingSuggestedKeyFactors, setIsLoadingSuggestedKeyFactors] =
    useState(false);

  const [isDetectingQuestionLinks, setIsDetectingQuestionLinks] =
    useState(false);
  const [questionLinkCandidates, setQuestionLinkCandidates] = useState<
    Question[]
  >([]);
  const questionLinksCheckedRef = useRef<Set<number>>(new Set());

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

      const hydratedDrafts: KeyFactorDraft[] = await Promise.all(
        drafts.map(async (draft) => {
          if (!isNewsDraft(draft) || !draft.news?.url) return draft;

          if (draft.news.title && draft.news.source) return draft;

          const preview = await fetchNewsPreview(draft.news.url).catch(
            () => null
          );
          if (!preview) return draft;

          return {
            ...draft,
            news: {
              ...draft.news,
              url: preview.url,
              title: preview.title,
              img_url: preview.favicon_url ?? "",
              source: preview.media_label,
              published_at: preview.created_at,
            },
          };
        })
      );

      const filtered = hydratedDrafts.filter(
        (d) =>
          isDriverDraft(d) ||
          isBaseRateDraft(d) ||
          (isNewsDraft(d) && d.news?.title && d.news?.source)
      );

      setSuggestedKeyFactors(filtered);
      fetchedOnceRef.current.add(cid);

      // Track when key factors are successfully generated
      if (filtered.length > 0) {
        sendAnalyticsEvent("keyFactorLLMGenerated", {
          event_category: "success",
          count: filtered.length,
          driver_count: filtered.filter(isDriverDraft).length,
          base_rate_count: filtered.filter(isBaseRateDraft).length,
          news_count: filtered.filter(isNewsDraft).length,
        });
      }
    } finally {
      setIsLoadingSuggestedKeyFactors(false);
      delete inFlightRef.current[cid];
    }
  }, []);

  useEffect(() => {
    if (!shouldLoadKeyFactors || !commentId) return;
    if (questionLinksCheckedRef.current.has(commentId)) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    // Track automatic generation attempt (before user clicks button)
    if (!fetchedOnceRef.current.has(commentId)) {
      sendAnalyticsEvent("keyFactorLLMGenerationAttempted", {
        event_category: "automatic",
      });
    }

    const ids = extractQuestionNumbersFromText(comment.text || "");
    if (!ids.length) {
      questionLinksCheckedRef.current.add(commentId);
      if (!fetchedOnceRef.current.has(commentId)) {
        void fetchSuggestions(commentId);
      }
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsDetectingQuestionLinks(true);
      try {
        const questions = await fetchQuestionsForIds(ids);
        if (cancelled) return;

        const existingLinkedIds = new Set<number>();
        [...coherenceLinks.data].forEach((link) => {
          if (link.question1_id) existingLinkedIds.add(link.question1_id);
          if (link.question2_id) existingLinkedIds.add(link.question2_id);
        });

        const candidates = questions.filter(
          (q) => !existingLinkedIds.has(q.id)
        );

        if (!candidates.length) {
          setQuestionLinkCandidates([]);
          questionLinksCheckedRef.current.add(commentId);
          if (!fetchedOnceRef.current.has(commentId)) {
            void fetchSuggestions(commentId);
          }
          return;
        }

        setQuestionLinkCandidates(candidates);
        questionLinksCheckedRef.current.add(commentId);

        if (!fetchedOnceRef.current.has(commentId)) {
          void fetchSuggestions(commentId);
        }
      } finally {
        if (!cancelled) {
          setIsDetectingQuestionLinks(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    shouldLoadKeyFactors,
    commentId,
    comments,
    fetchSuggestions,
    coherenceLinks,
    aggregateCoherenceLinks,
  ]);

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
    submitType: "driver" | "base_rate" | "news",
    markdown?: string
  ): Promise<
    | { errors: ErrorResponse; comment?: never }
    | { error?: never; comment: BECommentType }
  > => {
    const driverDrafts = submittedDrafts.filter(isDriverDraft);
    const baseRateDrafts = submittedDrafts.filter(isBaseRateDraft);
    const newsDrafts = submittedDrafts.filter(isNewsDraft);
    const suggestedDriverDrafts = suggested.filter(isDriverDraft);
    const suggestedBaseRateDrafts = suggested.filter(isBaseRateDraft);
    const suggestedNewsDrafts = suggested.filter(isNewsDraft);

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

    const finalNews =
      submitType === "news" ? [...newsDrafts, ...suggestedNewsDrafts] : [];

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

    const newsPayloads = finalNews.map((d) =>
      applyTargetForDraft(d, { news: d.news })
    );

    const writePayloads = [
      ...driverPayloads,
      ...baseRatePayloads,
      ...newsPayloads,
    ];

    const comment = commentId
      ? await addKeyFactorsToComment(commentId, writePayloads)
      : await createComment({
          on_post: postId,
          text: markdown || "",
          key_factors: writePayloads,
          is_private: false,
        });

    // Determine if this is a manual creation or from LLM suggestions
    // Count based on filtered arrays to exclude empty drafts
    const manualCount =
      (submitType === "driver"
        ? driverDrafts.filter((d) => d.driver.text.trim() !== "").length
        : 0) +
      (submitType === "base_rate" ? baseRateDrafts.length : 0) +
      (submitType === "news" ? newsDrafts.length : 0);
    const suggestedCount =
      (submitType === "driver"
        ? suggestedDriverDrafts.filter((d) => d.driver.text.trim() !== "")
            .length
        : 0) +
      (submitType === "base_rate" ? suggestedBaseRateDrafts.length : 0) +
      (submitType === "news" ? suggestedNewsDrafts.length : 0);

    // Track the creation source
    let source = "manual";
    if (suggestedCount > 0 && manualCount === 0) {
      source = "llm_suggestion";
    } else if (suggestedCount > 0 && manualCount > 0) {
      source = "mixed";
    }

    sendAnalyticsEvent("addKeyFactor", {
      event_label: isNil(commentId) ? "fromList" : "fromComment",
      event_category: submitType,
      source,
      count: writePayloads.length,
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
    const submitType: "driver" | "base_rate" | "news" = isDriverDraft(draft)
      ? "driver"
      : isBaseRateDraft(draft)
        ? "base_rate"
        : isNewsDraft(draft)
          ? "news"
          : (() => {
              return undefined as never;
            })();

    if (!submitType) return;

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
    setQuestionLinkCandidates([]);
  };

  return {
    errors,
    setErrors,
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,

    isDetectingQuestionLinks,
    questionLinkCandidates,

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
