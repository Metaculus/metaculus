"use client";

import { useEffect, useRef, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { useAuth } from "@/contexts/auth_context";
import { ImpactMetadata, KeyFactor } from "@/types/comment";
import { KeyFactorDraft, NewsDraft } from "@/types/key_factors";
import { NewsArticle } from "@/types/news";
import { PostWithForecasts } from "@/types/post";
import { isNewsDraft } from "@/utils/key_factors";

import { Target } from "../item_creation/driver/option_target_picker";
import { INITIAL_DRAFTS, useKeyFactorsCtx } from "../key_factors_context";
import KeyFactorsTypePicker from "../key_factors_type_picker";
import { KFType } from "../types";
import { updateCommentKeyFactors } from "../utils";
import KeyFactorsAddInCommentBaseRate from "./key_factors_add_in_comment_base_rate";
import KeyFactorsAddInCommentDriver from "./key_factors_add_in_comment_driver";
import KeyFactorsAddInCommentLLMSuggestions from "./key_factors_add_in_comment_llm_suggestions";
import KeyFactorsAddInCommentNews from "./key_factors_add_in_comment_news";

type Props = {
  postData: PostWithForecasts;
  onAfterCommentSubmit?: () => void;
  closeKeyFactorsForm?: () => void;
  onSuggestionsCompleted?: () => void;
};

const KeyFactorsAddInComment: React.FC<Props> = ({
  postData,
  onAfterCommentSubmit,
  closeKeyFactorsForm,
  onSuggestionsCompleted,
}) => {
  const [selectedType, setSelectedType] = useState<KFType>(null);
  const [autoOpenedForSuggestions, setAutoOpenedForSuggestions] =
    useState(false);

  const { user, setUser } = useAuth();

  const {
    drafts,
    isLoadingSuggestedKeyFactors,
    suggestedKeyFactors,
    setErrors: setKeyFactorsErrors,
    submit,
    resetAll,
    setDrafts,
    loadSuggestions,
    questionLinkCandidates,
  } = useKeyFactorsCtx();

  const { comments, setComments } = useCommentsFeed();

  const [brShowErrorsSignal, setBrShowErrorsSignal] = useState(0);
  const brIsValidRef = useRef(false);
  const [pendingNewsSubmit, setPendingNewsSubmit] = useState(false);

  const afterSuccessfulSubmit = (newCommentId: number, newKf: KeyFactor[]) => {
    if (user && !user.should_suggest_keyfactors) {
      setUser({ ...user, should_suggest_keyfactors: true });
    }
    const updated = comments.map((c) =>
      updateCommentKeyFactors(c, newCommentId, newKf ?? [])
    );
    resetAll();
    setComments(updated);
    onAfterCommentSubmit?.();
    closeKeyFactorsForm?.();
  };

  const handleSubmitDriver = async () => {
    const result = await submit("driver");
    if (result && "errors" in result) {
      setKeyFactorsErrors(result.errors);
      return;
    }
    if (result?.comment) {
      afterSuccessfulSubmit(
        result.comment.id,
        result.comment.key_factors ?? []
      );
    } else {
      closeKeyFactorsForm?.();
    }
  };

  const handleSubmitBaseRate = async () => {
    setBrShowErrorsSignal((n) => n + 1);
    await new Promise(requestAnimationFrame);
    if (!brIsValidRef.current) return;

    const result = await submit("base_rate");
    if (result && "errors" in result) {
      setKeyFactorsErrors(result.errors);
      return;
    }
    if (result?.comment) {
      afterSuccessfulSubmit(
        result.comment.id,
        result.comment.key_factors ?? []
      );
    } else {
      closeKeyFactorsForm?.();
    }
  };

  const handleSubmitNews = ({
    article,
    impact,
    target,
  }: {
    article: NewsArticle;
    impact: ImpactMetadata;
    target: Target;
  }) => {
    if (!article) return;

    const newsDrafts: NewsDraft[] = [
      {
        news: {
          url: article.url,
          title: article.title,
          img_url: article.favicon_url ?? "",
          source: article.media_label,
          published_at: article.created_at,
          impact_direction: impact.impact_direction ?? null,
          certainty: impact.certainty ?? null,
        },
        question_id: target.question_id,
        question_option: target.question_option,
      },
    ];

    setDrafts(() => newsDrafts as KeyFactorDraft[]);
    setPendingNewsSubmit(true);
  };

  useEffect(() => {
    if (!pendingNewsSubmit) return;

    if (!drafts.length) return;
    const firstDraft = drafts[0];
    if (!firstDraft || !isNewsDraft(firstDraft)) return;

    const run = async () => {
      setPendingNewsSubmit(false);

      const result = await submit("news");
      if (result && "errors" in result) {
        setKeyFactorsErrors(result.errors);
        return;
      }
      if (result?.comment) {
        afterSuccessfulSubmit(
          result.comment.id,
          result.comment.key_factors ?? []
        );
      } else {
        closeKeyFactorsForm?.();
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNewsSubmit, drafts, submit]);

  const onCancel = () => {
    closeKeyFactorsForm?.();
    resetAll();
    setDrafts(INITIAL_DRAFTS);
    setPendingNewsSubmit(false);
  };

  const handlePickType = (type: KFType) => {
    if (type === "ask_llm") {
      loadSuggestions(true);
      setAutoOpenedForSuggestions(true);
    }
    setSelectedType(type);
  };

  useEffect(() => {
    const hasAnySuggestions =
      suggestedKeyFactors.length > 0 || questionLinkCandidates.length > 0;

    if (
      hasAnySuggestions &&
      selectedType === null &&
      !autoOpenedForSuggestions
    ) {
      setSelectedType("ask_llm");
      setAutoOpenedForSuggestions(true);
    }
  }, [
    suggestedKeyFactors.length,
    questionLinkCandidates.length,
    selectedType,
    autoOpenedForSuggestions,
  ]);

  return (
    <>
      {!selectedType && !isLoadingSuggestedKeyFactors && (
        <KeyFactorsTypePicker onPick={handlePickType} withLLM />
      )}

      {selectedType === "driver" && (
        <KeyFactorsAddInCommentDriver
          postData={postData}
          onSubmit={handleSubmitDriver}
          onCancel={onCancel}
          onBack={() => setSelectedType(null)}
        />
      )}

      {selectedType === "ask_llm" && (
        <KeyFactorsAddInCommentLLMSuggestions
          onBack={() => setSelectedType(null)}
          postData={postData}
          setSelectedType={setSelectedType}
          onAllSuggestionsHandled={() => {
            resetAll();
            setDrafts(INITIAL_DRAFTS);
            setPendingNewsSubmit(false);
            setSelectedType(null);
            onSuggestionsCompleted?.();
          }}
        />
      )}

      {selectedType === "base_rate" && (
        <KeyFactorsAddInCommentBaseRate
          postData={postData}
          onSubmit={handleSubmitBaseRate}
          onCancel={onCancel}
          onBack={() => setSelectedType(null)}
          showErrorsSignal={brShowErrorsSignal}
          onValidate={(ok) => {
            brIsValidRef.current = ok;
          }}
        />
      )}

      {selectedType === "news" && (
        <KeyFactorsAddInCommentNews
          postData={postData}
          onSubmit={handleSubmitNews}
          onCancel={onCancel}
          onBack={() => setSelectedType(null)}
        />
      )}
    </>
  );
};

export default KeyFactorsAddInComment;
