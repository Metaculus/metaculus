"use client";

import {
  faCheck,
  faClose,
  faPen,
  faRobot,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { createCoherenceLink } from "@/app/(main)/questions/actions";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";
import {
  KeyFactor,
  KeyFactorVoteAggregate,
  News,
  StrengthValues,
} from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { Question } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import {
  isBaseRateDraft,
  isDriverDraft,
  isNewsDraft,
} from "@/utils/key_factors";
import { inferEffectiveQuestionTypeFromPost } from "@/utils/questions/helpers";

import KeyFactorsBaseRateForm from "../item_creation/base_rate/key_factors_base_rate_form";
import KeyFactorsNewDriverFields from "../item_creation/driver/key_factors_new_driver_fields";
import KeyFactorsNewItemContainer from "../item_creation/key_factors_new_item_container";
import KeyFactorsNewsSuggestionFields from "../item_creation/news/key_factors_news_suggestion_fields";
import CopyQuestionLinkForm from "../item_creation/question_link/copy_question_link_form";
import { KeyFactorItem } from "../item_view";
import KeyFactorCardContainer from "../item_view/key_factor_card_container";
import KeyFactorsCarousel from "../key_factors_carousel";
import { useKeyFactorsCtx } from "../key_factors_context";
import { KFType } from "../types";

type Props = {
  onBack: () => void;
  postData: PostWithForecasts;
  setSelectedType: React.Dispatch<React.SetStateAction<KFType>>;
  onAllSuggestionsHandled?: () => void;
};

type EditingSession = {
  id: number;
  draft: KeyFactorDraft;
  originalDraft: KeyFactorDraft;
  index: number;
  showErrors: boolean;
};

type QuestionLinkSuggestion = {
  question: Question;
  direction: QuestionLinkDirection;
  strength: QuestionLinkStrength;
};

type QuestionLinkEditingSession = {
  id: number;
  suggestion: QuestionLinkSuggestion;
  index: number;
  swapped: boolean;
};

type CombinedSuggestionItem =
  | {
      kind: "link";
      link: QuestionLinkSuggestion;
      linkIndex: number;
    }
  | {
      kind: "keyFactor";
      keyFactor: KeyFactorDraft;
      keyFactorIndex: number;
    };

/**
 * Helper to determine the type of a key factor draft
 */
const getKeyFactorType = (
  kf: KeyFactorDraft
): "driver" | "base_rate" | "news" =>
  isDriverDraft(kf) ? "driver" : isBaseRateDraft(kf) ? "base_rate" : "news";

const KeyFactorsAddInCommentLLMSuggestions: React.FC<Props> = ({
  onBack,
  postData,
  setSelectedType,
  onAllSuggestionsHandled,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const {
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,
    addSingleSuggestedKeyFactor,
    setErrors: setKeyFactorsErrors,
  } = useKeyFactorsCtx();

  const { questionLinkCandidates } = useKeyFactorsCtx();
  const { updateCoherenceLinks } = useCoherenceLinksContext();

  const [linkSuggestions, setLinkSuggestions] = useState<
    QuestionLinkSuggestion[]
  >(() => []);

  const combinedItems: CombinedSuggestionItem[] = useMemo(() => {
    const linkItems: CombinedSuggestionItem[] = linkSuggestions.map(
      (link, idx) => ({
        kind: "link",
        link,
        linkIndex: idx,
      })
    );

    const keyFactorItems: CombinedSuggestionItem[] = suggestedKeyFactors.map(
      (keyFactor, idx) => ({
        kind: "keyFactor",
        keyFactor,
        keyFactorIndex: idx,
      })
    );

    return [...linkItems, ...keyFactorItems];
  }, [linkSuggestions, suggestedKeyFactors]);

  const [linkEditingSessions, setLinkEditingSessions] = useState<
    QuestionLinkEditingSession[]
  >([]);
  const linkEditingIdRef = useRef(0);

  const initializedFromCandidatesRef = useRef(false);

  useEffect(() => {
    if (initializedFromCandidatesRef.current) return;
    if (!questionLinkCandidates || questionLinkCandidates.length === 0) return;

    setLinkSuggestions(
      questionLinkCandidates.map((q) => ({
        question: q,
        direction: "positive",
        strength: "medium",
      }))
    );
    initializedFromCandidatesRef.current = true;
  }, [questionLinkCandidates]);

  const [editingSessions, setEditingSessions] = useState<EditingSession[]>([]);
  const editingIdRef = useRef(0);

  const hasEverHadSuggestionsRef = useRef(false);

  useEffect(() => {
    const hasAnySuggestions =
      suggestedKeyFactors.length > 0 || linkSuggestions.length > 0;

    if (hasAnySuggestions) {
      hasEverHadSuggestionsRef.current = true;
    }

    const nothingLeft =
      suggestedKeyFactors.length === 0 &&
      linkSuggestions.length === 0 &&
      editingSessions.length === 0 &&
      linkEditingSessions.length === 0;

    if (
      hasEverHadSuggestionsRef.current &&
      !isLoadingSuggestedKeyFactors &&
      nothingLeft
    ) {
      setSelectedType(null);
      onAllSuggestionsHandled?.();
    }
  }, [
    suggestedKeyFactors.length,
    linkSuggestions.length,
    editingSessions.length,
    linkEditingSessions.length,
    isLoadingSuggestedKeyFactors,
    setSelectedType,
    onAllSuggestionsHandled,
  ]);

  const updateEditingSession = (
    id: number,
    updater: (session: EditingSession) => EditingSession
  ) => {
    setEditingSessions((prev) =>
      prev.map((session) => (session.id === id ? updater(session) : session))
    );
  };

  const removeEditingSession = (id: number) => {
    setEditingSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const reinsertIntoSuggestions = (
    draftToInsert: KeyFactorDraft | null,
    index: number
  ) => {
    if (!draftToInsert) return;

    setSuggestedKeyFactors((prev) => {
      const next = [...prev];
      const clampedIndex = Math.min(index, next.length);
      next.splice(clampedIndex, 0, draftToInsert);
      return next;
    });
  };

  const handleEdit = (
    kf: KeyFactorDraft,
    idx: number,
    opts?: { showErrors?: boolean }
  ) => {
    // Track edit action
    const keyFactorType = getKeyFactorType(kf);
    sendAnalyticsEvent("keyFactorLLMSuggestionEdited", {
      event_category: keyFactorType,
    });

    const id = editingIdRef.current++;
    setEditingSessions((prev) => [
      ...prev,
      {
        id,
        draft: kf,
        originalDraft: kf,
        index: idx,
        showErrors: !!opts?.showErrors,
      },
    ]);
    setSuggestedKeyFactors((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitEditedSession = async (session: EditingSession) => {
    const result = await addSingleSuggestedKeyFactor(session.draft);

    if (result && "errors" in result && result.errors) {
      setKeyFactorsErrors(result.errors);
      return;
    }

    setEditingSessions((prev) => prev.filter((s) => s.id !== session.id));
  };

  const handleApplyEdit = (sessionId: number) => {
    const session = editingSessions.find((s) => s.id === sessionId);
    if (!session) return;

    void submitEditedSession(session);
  };

  const handleDiscardEdit = (sessionId: number) => {
    const session = editingSessions.find((s) => s.id === sessionId);
    if (!session) return;
    reinsertIntoSuggestions(session.originalDraft, session.index);
    removeEditingSession(sessionId);
  };

  const EditingToolbar = ({
    onApply,
    onDiscard,
  }: {
    onApply: () => void;
    onDiscard: () => void;
  }) => (
    <div className="absolute right-2 top-2 flex justify-end gap-2">
      <KeyFactorActionButton kind="accept" onClick={onApply} />
      <KeyFactorActionButton kind="reject" onClick={onDiscard} />
    </div>
  );

  const renderEditingBlock = (session: EditingSession, content: ReactNode) => (
    <div key={session.id} className="relative">
      <EditingToolbar
        onApply={() => handleApplyEdit(session.id)}
        onDiscard={() => handleDiscardEdit(session.id)}
      />
      {content}
    </div>
  );

  const editingForms = editingSessions.flatMap((session) => {
    if (isDriverDraft(session.draft)) {
      return [
        renderEditingBlock(
          session,
          <KeyFactorsNewDriverFields
            key={session.id}
            draft={session.draft}
            setDraft={(next) =>
              updateEditingSession(session.id, (prev) => ({
                ...prev,
                draft: next,
              }))
            }
            showXButton={false}
            onXButtonClick={() => handleDiscardEdit(session.id)}
            post={postData}
            showErrorsSignal={session.showErrors ? 1 : 0}
          />
        ),
      ];
    }

    if (isBaseRateDraft(session.draft)) {
      return [
        renderEditingBlock(
          session,
          <KeyFactorsBaseRateForm
            key={session.id}
            draft={session.draft}
            setDraft={(next) =>
              updateEditingSession(session.id, (prev) => ({
                ...prev,
                draft: next,
              }))
            }
            post={postData}
            showErrorsSignal={session.showErrors ? 1 : 0}
          />
        ),
      ];
    }

    if (isNewsDraft(session.draft)) {
      return [
        renderEditingBlock(
          session,
          <KeyFactorsNewsSuggestionFields
            key={session.id}
            draft={session.draft}
            setDraft={(next) =>
              updateEditingSession(session.id, (prev) => ({
                ...prev,
                draft: next,
              }))
            }
            post={postData}
          />
        ),
      ];
    }

    return [];
  });

  const removeLinkAt = (idx: number) => {
    setLinkSuggestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeKeyFactorAt = (idx: number) => {
    setSuggestedKeyFactors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleEditLink = (suggestion: QuestionLinkSuggestion, idx: number) => {
    const id = linkEditingIdRef.current++;
    setLinkEditingSessions((prev) => [
      ...prev,
      { id, suggestion, index: idx, swapped: false },
    ]);
    removeLinkAt(idx);
  };

  const handleDiscardLinkEdit = (sessionId: number) => {
    setLinkEditingSessions((prev) => {
      const session = prev.find((s) => s.id === sessionId);
      if (!session) return prev;

      setLinkSuggestions((old) => {
        const exists = old.some(
          (s) => s.question.id === session.suggestion.question.id
        );
        if (exists) {
          return old;
        }

        const copy = [...old];
        const insertIndex = Math.min(session.index, copy.length);
        copy.splice(insertIndex, 0, session.suggestion);
        return copy;
      });

      return prev.filter((s) => s.id !== sessionId);
    });
  };

  const handleApplyLinkEdit = async (sessionId: number) => {
    const session = linkEditingSessions.find((s) => s.id === sessionId);
    if (!session || !postData.question) return;

    const { suggestion, swapped } = session;
    const dirNumber = suggestion.direction === "positive" ? 1 : -1;
    const strengthMap: Record<QuestionLinkStrength, StrengthValues> = {
      low: StrengthValues.LOW,
      medium: StrengthValues.MEDIUM,
      high: StrengthValues.HIGH,
    };
    const strengthNumber = strengthMap[suggestion.strength];
    const type = "causal";

    const [sourceQuestion, targetQuestion] = swapped
      ? [suggestion.question, postData.question]
      : [postData.question, suggestion.question];

    const error = await createCoherenceLink(
      sourceQuestion,
      targetQuestion,
      dirNumber,
      strengthNumber,
      type
    );

    if (error) {
      console.error("createCoherenceLink error", error);
      return;
    }

    await updateCoherenceLinks();
    setLinkEditingSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleAcceptLink = async (
    suggestion: QuestionLinkSuggestion,
    idx: number
  ) => {
    if (!postData.question) return;

    const dirNumber = suggestion.direction === "positive" ? 1 : -1;
    const strengthMap: Record<QuestionLinkStrength, StrengthValues> = {
      low: StrengthValues.LOW,
      medium: StrengthValues.MEDIUM,
      high: StrengthValues.HIGH,
    };
    const strengthNumber = strengthMap[suggestion.strength];
    const type = "causal";

    const error = await createCoherenceLink(
      postData.question,
      suggestion.question,
      dirNumber,
      strengthNumber,
      type
    );

    if (error) {
      console.error("createCoherenceLink error", error);
      return;
    }

    await updateCoherenceLinks();
    removeLinkAt(idx);
  };

  const linkEditingBlocks = linkEditingSessions.map((session) => (
    <div key={`link-edit-${session.id}`} className="relative">
      <EditingToolbar
        onApply={() => handleApplyLinkEdit(session.id)}
        onDiscard={() => handleDiscardLinkEdit(session.id)}
      />
      <KeyFactorsNewItemContainer containerClassName="p-4" withHeader={false}>
        <p className="my-0 max-w-[85%] text-sm text-gray-800 dark:text-gray-800-dark">
          {t("copyLinkTitle")}
        </p>
        <p className="my-0 text-sm text-gray-800 dark:text-gray-800-dark">
          {t("copyQuestionLinkPrivate")}
        </p>

        <CopyQuestionLinkForm
          direction={session.suggestion.direction}
          setDirection={(updater) =>
            setLinkEditingSessions((prev) =>
              prev.map((s) =>
                s.id === session.id
                  ? {
                      ...s,
                      suggestion: {
                        ...s.suggestion,
                        direction:
                          typeof updater === "function"
                            ? updater(s.suggestion.direction)
                            : updater,
                      },
                    }
                  : s
              )
            )
          }
          strength={session.suggestion.strength}
          setStrength={(updater) =>
            setLinkEditingSessions((prev) =>
              prev.map((s) =>
                s.id === session.id
                  ? {
                      ...s,
                      suggestion: {
                        ...s.suggestion,
                        strength:
                          typeof updater === "function"
                            ? updater(s.suggestion.strength)
                            : updater,
                      },
                    }
                  : s
              )
            )
          }
          sourceTitle={
            session.swapped
              ? session.suggestion.question.title
              : postData.question?.title ?? ""
          }
          targetTitle={
            session.swapped
              ? postData.question?.title ?? ""
              : session.suggestion.question.title
          }
          handleSwap={() =>
            setLinkEditingSessions((prev) =>
              prev.map((s) =>
                s.id === session.id ? { ...s, swapped: !s.swapped } : s
              )
            )
          }
          withContainer={false}
        />
      </KeyFactorsNewItemContainer>
    </div>
  ));

  const showInitialLoader =
    isLoadingSuggestedKeyFactors && suggestedKeyFactors.length === 0;

  const showEmptyState =
    !showInitialLoader &&
    !isLoadingSuggestedKeyFactors &&
    suggestedKeyFactors.length === 0 &&
    editingSessions.length === 0 &&
    linkSuggestions.length === 0 &&
    linkEditingSessions.length === 0;

  return (
    <KeyFactorsNewItemContainer
      icon={faRobot}
      label={t("generatedKeyFactors")}
      onBack={onBack}
      color="purple"
      headerClassName={cn(
        "text-purple-800 dark:text-purple-800-dark opacity-100 [&>svg]:opacity-50",
        showInitialLoader && "hidden"
      )}
    >
      {showInitialLoader && (
        <div className="flex justify-center py-6">
          <LoadingSpinner className="size-5 text-purple-600 dark:text-purple-600-dark" />
        </div>
      )}

      {showEmptyState && (
        <p className="my-0 text-sm text-purple-800 dark:text-purple-800-dark">
          {t("noGeneratedKeyFactors")}
        </p>
      )}

      {!showInitialLoader &&
        (editingForms.length > 0 || linkEditingBlocks.length > 0) && (
          <div className="flex flex-col gap-4">
            {editingForms}
            {linkEditingBlocks}
          </div>
        )}

      {!showInitialLoader && user && combinedItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <KeyFactorsCarousel
            items={combinedItems}
            gapClassName="gap-3.5"
            renderItem={(item, idx) => {
              if (item.kind === "link") {
                const { link, linkIndex } = item;

                return (
                  <div
                    key={`link-${link.question.id}-${idx}`}
                    className="group relative mt-3"
                  >
                    <KeyFactorCardContainer
                      isCompact
                      mode="consumer"
                      linkToComment={false}
                      className="bg-gray-0 shadow-sm dark:bg-gray-0-dark"
                    >
                      <div className="mt-1 text-sm font-medium leading-5 text-gray-900 dark:text-gray-900-dark">
                        {link.question.title}
                      </div>

                      <div className="mt-3 flex gap-6 text-xs text-gray-700 dark:text-gray-700-dark">
                        <div>
                          <div className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-500-dark">
                            Direction
                          </div>
                          <div className="capitalize">
                            {t(
                              link.direction === "positive"
                                ? "positive"
                                : "negative"
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase text-gray-500 dark:text-gray-500-dark">
                            {t("strength")}
                          </div>
                          <div className="capitalize">{t(link.strength)}</div>
                        </div>
                      </div>
                    </KeyFactorCardContainer>

                    <div className="absolute -right-3 -top-3 flex gap-2">
                      <KeyFactorActionButton
                        kind="accept"
                        onClick={() => handleAcceptLink(link, linkIndex)}
                      />
                      <KeyFactorActionButton
                        kind="edit"
                        onClick={() => handleEditLink(link, linkIndex)}
                      />
                      <KeyFactorActionButton
                        kind="reject"
                        onClick={() => removeLinkAt(linkIndex)}
                      />
                    </div>
                  </div>
                );
              }

              const { keyFactor, keyFactorIndex } = item;
              const kf = keyFactor;

              const question = postData.group_of_questions?.questions.find(
                (obj) => obj.id === kf.question_id
              );

              const emptyAggregate: KeyFactorVoteAggregate = {
                score: 0,
                user_vote: null,
                count: 0,
                aggregated_data: [],
              };

              let news: News | null = null;
              if (kf.news && kf.news.url && kf.news.title && kf.news.source) {
                news = {
                  url: kf.news.url,
                  title: kf.news.title,
                  source: kf.news.source,
                  img_url: kf.news.img_url ?? undefined,
                  published_at: kf.news.published_at ?? undefined,
                  impact_direction: kf.news.impact_direction ?? null,
                  certainty: kf.news.certainty ?? null,
                };
              }

              const fake: KeyFactor = {
                id: -1,
                driver: kf.driver ?? null,
                base_rate: kf.base_rate ?? null,
                news,
                author: user,
                comment_id: -1,
                vote: emptyAggregate,
                question_id: kf.question_id ?? null,
                question: kf.question_id
                  ? {
                      id: kf.question_id,
                      label: question?.label || "",
                      unit: question?.unit ?? null,
                    }
                  : null,
                question_option: kf.question_option,
                freshness: 0,
                post: {
                  id: postData.id,
                  unit: postData.question?.unit || question?.unit,
                  question_type:
                    inferEffectiveQuestionTypeFromPost(postData) || undefined,
                },
                flagged_by_me: false,
              };

              const isBaseRateWithMissingSource =
                !!kf.base_rate && !kf.base_rate.source;

              return (
                <div
                  key={`kf-${keyFactorIndex}-${idx}`}
                  className="group relative mt-3"
                >
                  <KeyFactorItem
                    keyFactor={fake}
                    isCompact
                    mode="consumer"
                    linkToComment={false}
                    isSuggested
                    className="bg-gray-0 dark:bg-gray-0-dark"
                  />
                  <div className="absolute -right-3 -top-3 flex gap-2">
                    {!isBaseRateWithMissingSource && (
                      <KeyFactorActionButton
                        kind="accept"
                        onClick={async () => {
                          // Track accept action
                          const keyFactorType = getKeyFactorType(kf);
                          sendAnalyticsEvent("keyFactorLLMSuggestionAccepted", {
                            event_category: keyFactorType,
                          });

                          const res = await addSingleSuggestedKeyFactor(kf);
                          if (!res || ("errors" in res && res.errors)) {
                            handleEdit(kf, keyFactorIndex, {
                              showErrors: true,
                            });
                            return;
                          }
                          removeKeyFactorAt(keyFactorIndex);
                        }}
                      />
                    )}
                    <KeyFactorActionButton
                      kind="edit"
                      onClick={() => handleEdit(kf, keyFactorIndex)}
                    />
                    <KeyFactorActionButton
                      kind="reject"
                      onClick={() => {
                        // Track reject action
                        const keyFactorType = getKeyFactorType(kf);
                        sendAnalyticsEvent("keyFactorLLMSuggestionRejected", {
                          event_category: keyFactorType,
                        });

                        removeKeyFactorAt(keyFactorIndex);
                      }}
                    />
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
    </KeyFactorsNewItemContainer>
  );
};

const KeyFactorActionButton: React.FC<{
  kind: "accept" | "edit" | "reject";
  onClick: () => void;
}> = ({ kind, onClick }) => {
  let icon = faCheck;
  let className =
    "pointer-events-auto flex h-6 w-6 rounded-full p-0 bg-olive-400 text-olive-700 dark:bg-olive-400-dark dark:text-olive-700-dark";

  if (kind === "edit") {
    icon = faPen;
    className =
      "pointer-events-auto flex h-6 w-6 rounded-full p-0 bg-blue-400 text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark";
  } else if (kind === "reject") {
    icon = faClose;
    className =
      "pointer-events-auto flex h-6 w-6 rounded-full p-0 bg-salmon-300 text-salmon-600 dark:bg-salmon-300-dark dark:text-salmon-600-dark";
  }

  return (
    <button className={className} onClick={onClick}>
      <FontAwesomeIcon icon={icon} className="m-auto size-3" />
    </button>
  );
};

export default KeyFactorsAddInCommentLLMSuggestions;
