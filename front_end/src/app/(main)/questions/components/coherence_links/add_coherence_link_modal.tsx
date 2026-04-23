"use client";

import { faArrowLeft, faArrowsUpDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { createCoherenceLink } from "@/app/(main)/questions/actions";
import LinkStrengthSelectorComponent from "@/app/(main)/questions/components/coherence_links/link_strength_selector_component";
import CoherencePredictionTile from "@/app/(main)/questions/components/coherence_links/coherence_prediction_tile";
import BaseModal from "@/components/base_modal";
import SearchInput from "@/components/search_input";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import ClientPostsApi from "@/services/api/posts/posts.client";
import {
  ALLOWED_COHERENCE_LINK_QUESTION_TYPES,
  LinkTypes,
} from "@/types/coherence";
import { Post, PostWithForecasts } from "@/types/post";
import {
  Question,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { getTermByDirectionAndQuestionType } from "@/utils/coherence";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

type Props = {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
};

type Step = "pick" | "configure";

const SUGGESTION_LIMIT = 8;

const AddCoherenceLinkModal: FC<Props> = ({ post, isOpen, onClose }) => {
  const t = useTranslations();
  const { coherenceLinks, updateCoherenceLinks } = useCoherenceLinksContext();
  const linkedQuestionIds = useMemo(() => {
    const ids = new Set<number>();
    for (const link of coherenceLinks.data) {
      ids.add(link.question1_id);
      ids.add(link.question2_id);
    }
    return ids;
  }, [coherenceLinks.data]);

  const [step, setStep] = useState<Step>("pick");
  const [search, setSearch] = useState("");
  const [suggested, setSuggested] = useState<PostWithForecasts[]>([]);
  const [results, setResults] = useState<PostWithForecasts[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selected, setSelected] = useState<Question | null>(null);
  // `isOutgoing = true` means current question → selected (current causes selected).
  // Default is `false`: the picked question points down to the current question, matching
  // the at-a-glance mental model the add modal presents before the user configures.
  const [isOutgoing, setIsOutgoing] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [strength, setStrength] = useState(2);
  const [submitError, setSubmitError] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = useCallback(() => {
    setStep("pick");
    setSearch("");
    setResults([]);
    setSelected(null);
    setIsOutgoing(false);
    setDirection(1);
    setStrength(2);
    setSubmitError(false);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const similar = await ClientPostsApi.getSimilarPosts(post.id);
        if (!cancelled) {
          setSuggested(
            similar
              .filter(
                (p) =>
                  p.id !== post.id &&
                  p.question &&
                  !linkedQuestionIds.has(p.question.id) &&
                  ALLOWED_COHERENCE_LINK_QUESTION_TYPES.includes(
                    p.question.type
                  )
              )
              .slice(0, SUGGESTION_LIMIT)
          );
        }
      } catch (e) {
        logError(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, post.id, resetState]);

  const runSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    try {
      const { results } = await ClientPostsApi.getPostsWithCP({
        search: query,
        forecast_type: ALLOWED_COHERENCE_LINK_QUESTION_TYPES,
        limit: 20,
      });
      setResults(
        results.filter(
          (p) =>
            p.id !== post.id &&
            p.question &&
            !linkedQuestionIds.has(p.question.id)
        )
      );
    } catch (e) {
      logError(e);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, 400);

  useEffect(() => {
    if (step !== "pick") return;
    if (search.trim()) setIsLoading(true);
    runSearch(search);
  }, [search, step, runSearch]);

  const displayedPosts = search.trim() ? results : suggested;

  function selectQuestion(p: PostWithForecasts) {
    if (!p.question) return;
    setSelected(p.question);
    setSubmitError(false);
    setStep("configure");
  }

  function goBack() {
    setStep("pick");
    setSubmitError(false);
  }

  async function submit() {
    if (!post.question || !selected) return;
    setIsSubmitting(true);
    setSubmitError(false);
    const [question1, question2] = isOutgoing
      ? [post.question, selected]
      : [selected, post.question];
    const result = await createCoherenceLink(
      question1,
      question2,
      direction,
      strength,
      LinkTypes.Causal
    );
    if (result === null) {
      await updateCoherenceLinks();
      onClose();
    } else {
      // Client filters out self-links and already-linked questions before
      // submit, and the DB constraint blocks duplicates from concurrent tabs.
      // So a failure here is an exceptional case — a generic error is enough.
      setSubmitError(true);
      setIsSubmitting(false);
    }
  }

  // The "causal target" is the question being influenced; its type drives the verb
  // shown in the direction pills (hastens/delays for dates, increases/decreases for
  // numeric/discrete, positive/negative otherwise).
  const causalTargetType =
    (isOutgoing ? selected?.type : post.question?.type) ?? QuestionType.Binary;

  const topQuestion = isOutgoing ? post.question : selected;
  const bottomQuestion = isOutgoing ? selected : post.question;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="m-0 flex h-full w-full max-w-none flex-col overscroll-contain rounded-none p-0 md:m-auto md:h-auto md:max-h-[85vh] md:max-w-xl md:rounded md:p-0"
    >
      <div className="flex items-center gap-3 border-b border-gray-300 px-5 py-3 pr-12 dark:border-gray-300-dark">
        {step === "configure" && (
          <button
            type="button"
            onClick={goBack}
            aria-label={t("back")}
            className="text-blue-700 hover:text-blue-900 dark:text-blue-700-dark dark:hover:text-blue-900-dark"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
          </button>
        )}
        <h2 className="m-0 text-lg font-medium leading-7">
          {step === "pick" ? t("linkQuestion") : t("configureRelationship")}
        </h2>
      </div>

      {step === "pick" ? (
        <div className="flex flex-1 flex-col gap-3 p-5">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onErase={() => setSearch("")}
            iconPosition="left"
            size="lg"
            placeholder={t("coherenceSearchPlaceholder")}
          />
          {!search.trim() && (
            <div className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600-dark">
              {t("suggestedQuestions")}
            </div>
          )}
          <div className="flex min-h-[240px] flex-1 flex-col gap-2 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-1 items-center justify-center py-8">
                <LoadingIndicator />
              </div>
            ) : displayedPosts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-8 text-sm text-gray-600 dark:text-gray-600-dark">
                {search.trim() ? t("noResults") : t("noSuggestions")}
              </div>
            ) : (
              displayedPosts.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectQuestion(p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectQuestion(p);
                    }
                  }}
                  className="flex cursor-pointer flex-row items-center gap-3 rounded border border-blue-400 bg-gray-0 p-4 transition-colors hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-400-dark dark:bg-gray-0-dark dark:hover:border-blue-500-dark dark:focus-visible:ring-blue-500-dark"
                >
                  <div className="flex-grow text-sm">{p.title}</div>
                  {p.question && (
                    <CoherencePredictionTile question={p.question} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        selected &&
        post.question && (
          <div className="flex flex-col gap-5 p-5">
            <div className="flex flex-col items-stretch gap-2">
              {topQuestion && (
                <>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600-dark">
                    {topQuestion.id === post.question.id
                      ? t("mainQuestion")
                      : t("questionBeingLinked")}
                  </div>
                  <QuestionPreviewCard
                    question={topQuestion}
                    isCurrent={topQuestion.id === post.question.id}
                  />
                </>
              )}
              <div className="grid grid-cols-3 items-center">
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setIsOutgoing((x) => !x)}
                  className="justify-self-start"
                >
                  <FontAwesomeIcon icon={faArrowsUpDown} className="mr-1.5" />
                  {t("swapCausality")}
                </Button>
                <svg
                  viewBox="0 0 24 40"
                  width="20"
                  height="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="mx-auto text-blue-700 dark:text-blue-700-dark"
                >
                  <line x1="12" y1="2" x2="12" y2="36" />
                  <polyline points="5,28 12,36 19,28" />
                </svg>
                <div />
              </div>
              {bottomQuestion && (
                <>
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600-dark">
                    {bottomQuestion.id === post.question.id
                      ? t("mainQuestion")
                      : t("questionBeingLinked")}
                  </div>
                  <QuestionPreviewCard
                    question={bottomQuestion}
                    isCurrent={bottomQuestion.id === post.question.id}
                  />
                </>
              )}
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600-dark">
                {t("direction")}
              </div>
              <div className="flex gap-2">
                <DirectionPill
                  polarity="positive"
                  selected={direction === 1}
                  onClick={() => setDirection(1)}
                  label={t(
                    getTermByDirectionAndQuestionType(1, causalTargetType)
                  )}
                />
                <DirectionPill
                  polarity="negative"
                  selected={direction === -1}
                  onClick={() => setDirection(-1)}
                  label={t(
                    getTermByDirectionAndQuestionType(-1, causalTargetType)
                  )}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-600-dark">
                {t("strength")}
              </div>
              <LinkStrengthSelectorComponent onSelect={setStrength} />
            </div>

            {submitError && (
              <FormErrorMessage
                className="text-base"
                errors={t("linkCreateGenericError")}
              />
            )}

            <Button
              onClick={submit}
              disabled={isSubmitting}
              variant="primary"
              size="md"
              className="self-stretch"
            >
              {t("linkQuestion")}
            </Button>
          </div>
        )
      )}
    </BaseModal>
  );
};

type QuestionPreviewCardProps = {
  question: Question;
  isCurrent: boolean;
};

const QuestionPreviewCard: FC<QuestionPreviewCardProps> = ({
  question,
  isCurrent,
}) => {
  const questionWithForecasts =
    "aggregations" in question ? (question as QuestionWithForecasts) : null;
  return (
    <div
      className={cn(
        "flex flex-row items-center gap-3 rounded-md p-4 text-sm",
        isCurrent
          ? "bg-blue-200 dark:bg-blue-200-dark"
          : "bg-gray-100 dark:bg-gray-100-dark"
      )}
    >
      <div className={cn("flex-grow", isCurrent && "font-semibold")}>
        {question.title}
      </div>
      {questionWithForecasts && (
        <CoherencePredictionTile question={questionWithForecasts} />
      )}
    </div>
  );
};

type DirectionPillProps = {
  polarity: "positive" | "negative";
  selected: boolean;
  label: string;
  onClick: () => void;
};

const DirectionPill: FC<DirectionPillProps> = ({
  polarity,
  selected,
  label,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex-1 rounded border-2 py-2 text-sm font-semibold capitalize transition-colors",
      polarity === "positive"
        ? "hover:bg-olive-200 border-olive-300 bg-olive-100 text-olive-800 dark:border-olive-300-dark dark:bg-olive-100-dark dark:text-olive-800-dark"
        : "border-salmon-300 bg-salmon-100 text-salmon-700 hover:bg-salmon-200 dark:border-salmon-300-dark dark:bg-salmon-100-dark dark:text-salmon-700-dark",
      selected
        ? "ring-2 ring-gray-100 ring-offset-2 ring-offset-gray-700 dark:ring-gray-100-dark dark:ring-offset-gray-700-dark"
        : "opacity-70"
    )}
  >
    {label}
  </button>
);

export default AddCoherenceLinkModal;
