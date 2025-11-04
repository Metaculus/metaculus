"use client";
import React, {
  createContext,
  useContext,
  useMemo,
  useReducer,
  useCallback,
  useState,
  useEffect,
} from "react";

import { useKeyFactors } from "@/app/(main)/questions/[id]/components/key_factors/hooks";
import type { BECommentType } from "@/types/comment";
import type { ErrorResponse } from "@/types/fetch";
import type { KeyFactorDraft } from "@/types/key_factors";
import type { PostWithForecasts } from "@/types/post";
import type { User } from "@/types/users";

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
  setDrafts: React.Dispatch<React.SetStateAction<KeyFactorDraft[]>>;
  setMarkdown: (m: string) => void;
  setSuggestedKeyFactors: React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >;
  setErrors: (e?: ErrorResponse) => void;
  resetAll: () => void;
  submit: (markdownOverride?: string) => Promise<SubmitResult>;
  loadSuggestions: () => void;
};

const NOOP = () => {};
const NOOP_ASYNC: Ctx["submit"] = async () => undefined;

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
  setDrafts: NOOP as unknown as React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >,
  setMarkdown: NOOP,
  setSuggestedKeyFactors: NOOP as unknown as React.Dispatch<
    React.SetStateAction<KeyFactorDraft[]>
  >,
  setErrors: NOOP,
  resetAll: NOOP,
  submit: NOOP_ASYNC,
  loadSuggestions: NOOP,
};

const KeyFactorsContext = createContext<Ctx | null>(null);

const INITIAL_DRIVER_DRAFT: KeyFactorDraft = {
  driver: { text: "", impact_direction: null, certainty: null },
};

function reducer(state: State, action: Partial<State>): State {
  return { ...state, ...action };
}

export const KeyFactorsProvider: React.FC<
  React.PropsWithChildren<InitOpts>
> = ({ children, user, post, commentId, suggest = false }) => {
  const enabled = !!user && !!post;

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
    drafts: [INITIAL_DRIVER_DRAFT],
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
    submit: submitImpl,
    isPending,
    clearState,
  } = useKeyFactors({
    user_id: user.id,
    commentId,
    postId: post.id,
    suggestKeyFactors: shouldLoadSuggestions,
  });

  useEffect(() => {
    if (!isLoadingSuggestedKeyFactors && shouldLoadSuggestions) {
      setShouldLoadSuggestions(false);
    }
  }, [isLoadingSuggestedKeyFactors, shouldLoadSuggestions]);

  const resetAll = useCallback(() => {
    dispatch({
      drafts: [INITIAL_DRIVER_DRAFT],
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
      submit: async (markdownOverride?: string) =>
        submitImpl(
          state.drafts,
          suggestedKeyFactors,
          markdownOverride ?? state.markdown
        ),
      loadSuggestions: () => {
        if (isLoadingSuggestedKeyFactors || shouldLoadSuggestions) return;
        setShouldLoadSuggestions(true);
      },
    }),
    [
      state,
      errors,
      limitError,
      factorsLimit,
      isPending,
      isLoadingSuggestedKeyFactors,
      shouldLoadSuggestions,
      suggestedKeyFactors,
      setSuggestedKeyFactors,
      setErrors,
      resetAll,
      submitImpl,
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
