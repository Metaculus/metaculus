"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
} from "react";

import { useKeyFactors } from "@/app/(main)/questions/[id]/components/key_factors/hooks";
import type { BECommentType } from "@/types/comment";
import type { ErrorResponse } from "@/types/fetch";
import type { KeyFactorDraft } from "@/types/key_factors";
import type { PostWithForecasts } from "@/types/post";
import { Question } from "@/types/question";
import type { User } from "@/types/users";

import { createEmptyBaseRateDraft } from "./item_creation/base_rate/utils";

type State = {
  drafts: KeyFactorDraft[];
  markdown: string;
};

type InitOpts = {
  user?: User | null;
  post?: PostWithForecasts | null;
  commentId?: number;
  suggest?: boolean;
};

type SubmitResult =
  | { errors: ErrorResponse }
  | { comment: BECommentType }
  | undefined;

type Ctx = State & {
  enabled: boolean;
  errors?: ErrorResponse;
  limitError?: string;
  factorsLimit: number;
  isPending: boolean;
  isLoadingSuggestedKeyFactors: boolean;
  suggestedKeyFactors: KeyFactorDraft[];
  isDetectingQuestionLinks: boolean;
  questionLinkCandidates: Question[];
  setDrafts: React.Dispatch<React.SetStateAction<KeyFactorDraft[]>>;
  setMarkdown: (m: string) => void;
  setSuggestedKeyFactors: React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >;
  setErrors: (e?: ErrorResponse) => void;
  resetAll: () => void;
  submit: (
    submitType: "driver" | "base_rate" | "news",
    markdownOverride?: string,
    draftsOverride?: KeyFactorDraft[]
  ) => Promise<SubmitResult>;
  loadSuggestions: (force?: boolean) => void;
  addSingleSuggestedKeyFactor: (draft: KeyFactorDraft) => Promise<SubmitResult>;
};

const NOOP = () => {};
const NOOP_SUBMIT = async (
  _submitType: "driver" | "base_rate" | "news",
  _markdownOverride?: string,
  _draftsOverride?: KeyFactorDraft[]
): Promise<SubmitResult> => undefined;

const NOOP_ADD_SINGLE = async (_draft: KeyFactorDraft): Promise<SubmitResult> =>
  undefined;

const DISABLED_CTX: Ctx = {
  enabled: false,
  drafts: [{ driver: { text: "", impact_direction: null, certainty: null } }],
  markdown: "",
  errors: undefined,
  limitError: undefined,
  factorsLimit: 0,
  isPending: false,
  isLoadingSuggestedKeyFactors: false,
  suggestedKeyFactors: [],
  isDetectingQuestionLinks: false,
  questionLinkCandidates: [],
  setDrafts: NOOP as unknown as React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >,
  setMarkdown: NOOP,
  setSuggestedKeyFactors: NOOP as unknown as React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >,
  setErrors: NOOP,
  resetAll: NOOP,
  submit: NOOP_SUBMIT,
  loadSuggestions: NOOP,
  addSingleSuggestedKeyFactor: NOOP_ADD_SINGLE,
};

const KeyFactorsContext = createContext<Ctx | null>(null);

export const INITIAL_DRAFTS: KeyFactorDraft[] = [
  {
    driver: { text: "", impact_direction: null, certainty: null },
  },
  createEmptyBaseRateDraft(""),
];

function reducer(state: State, action: Partial<State>): State {
  return { ...state, ...action };
}

export const KeyFactorsProvider: React.FC<
  React.PropsWithChildren<InitOpts>
> = ({ children, user, post, commentId, suggest = false }) => {
  const enabled = !!user && !!post && !post?.notebook;

  if (!enabled) {
    return (
      <KeyFactorsContext.Provider value={DISABLED_CTX}>
        {children}
      </KeyFactorsContext.Provider>
    );
  }

  return (
    <KeyFactorsProviderEnabled
      user={user}
      post={post}
      commentId={commentId}
      suggest={suggest}
    >
      {children}
    </KeyFactorsProviderEnabled>
  );
};

type EnabledProps = React.PropsWithChildren<{
  user: User;
  post: PostWithForecasts;
  commentId?: number;
  suggest?: boolean;
}>;

const KeyFactorsProviderEnabled: React.FC<EnabledProps> = ({
  children,
  user,
  post,
  commentId,
  suggest = false,
}) => {
  const [state, dispatch] = useReducer(reducer, {
    drafts: INITIAL_DRAFTS,
    markdown: "",
  });

  const [shouldLoadSuggestions, setShouldLoadSuggestions] =
    useState<boolean>(suggest);

  const {
    errors,
    setErrors,
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,
    limitError,
    factorsLimit,
    isDetectingQuestionLinks,
    questionLinkCandidates,
    submit: submitImpl,
    isPending,
    clearState,
    reloadSuggestions,
    addSingleSuggestedKeyFactor,
  } = useKeyFactors({
    user_id: user.id,
    commentId,
    postId: post.id,
    suggestKeyFactors: shouldLoadSuggestions,
  });

  const resetAll = useCallback(() => {
    dispatch({
      drafts: INITIAL_DRAFTS,
      markdown: "",
    });
    setErrors(undefined);
    clearState();
  }, [setErrors, clearState]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      enabled: true,
      errors,
      limitError,
      factorsLimit,
      isPending,
      isLoadingSuggestedKeyFactors,
      suggestedKeyFactors,
      isDetectingQuestionLinks,
      questionLinkCandidates,
      setDrafts: (updater) =>
        dispatch({
          drafts:
            typeof updater === "function"
              ? (updater as (prev: KeyFactorDraft[]) => KeyFactorDraft[])(
                  state.drafts
                )
              : (updater as KeyFactorDraft[]),
        }),
      setMarkdown: (m) => dispatch({ markdown: m }),
      setSuggestedKeyFactors,
      setErrors,
      resetAll,
      submit: async (
        submitType: "driver" | "base_rate" | "news",
        markdownOverride?: string,
        draftsOverride?: KeyFactorDraft[]
      ) =>
        submitImpl(
          draftsOverride ?? state.drafts,
          suggestedKeyFactors,
          submitType,
          markdownOverride ?? state.markdown
        ),
      loadSuggestions: (force?: boolean) => {
        if (isLoadingSuggestedKeyFactors) return;
        if (force) reloadSuggestions();
        else if (!shouldLoadSuggestions) setShouldLoadSuggestions(true);
      },
      addSingleSuggestedKeyFactor,
    }),
    [
      state,
      errors,
      limitError,
      factorsLimit,
      isPending,
      shouldLoadSuggestions,
      isLoadingSuggestedKeyFactors,
      suggestedKeyFactors,
      isDetectingQuestionLinks,
      questionLinkCandidates,
      setSuggestedKeyFactors,
      setErrors,
      resetAll,
      submitImpl,
      reloadSuggestions,
      addSingleSuggestedKeyFactor,
    ]
  );

  return (
    <KeyFactorsContext.Provider value={value}>
      {children}
    </KeyFactorsContext.Provider>
  );
};

export const useKeyFactorsCtx = () => {
  const ctx = useContext(KeyFactorsContext);
  if (!ctx)
    throw new Error("useKeyFactorsCtx must be used inside KeyFactorsProvider");
  return ctx;
};
