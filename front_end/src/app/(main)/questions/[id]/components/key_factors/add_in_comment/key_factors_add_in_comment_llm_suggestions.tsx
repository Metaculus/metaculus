"use client";

import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { ReactNode, useEffect, useRef, useState } from "react";

import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isBaseRateDraft, isDriverDraft } from "@/utils/key_factors";

import KeyFactorsBaseRateForm from "../item_creation/base_rate/key_factors_base_rate_form";
import KeyFactorsNewDriverFields from "../item_creation/driver/key_factors_new_driver_fields";
import KeyFactorsNewItemContainer from "../item_creation/key_factors_new_item_container";
import { useKeyFactorsCtx } from "../key_factors_context";
import KeyFactorsSuggestedItems, {
  KeyFactorActionButton,
} from "../key_factors_suggested_items";
import { KFType } from "../types";

type Props = {
  onBack: () => void;
  postData: PostWithForecasts;
  setSelectedType: React.Dispatch<React.SetStateAction<KFType>>;
};

type EditingSession = {
  id: number;
  draft: KeyFactorDraft;
  originalDraft: KeyFactorDraft;
  index: number;
  showErrors: boolean;
};

const KeyFactorsAddInCommentLLMSuggestions: React.FC<Props> = ({
  onBack,
  postData,
  setSelectedType,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const {
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,
  } = useKeyFactorsCtx();

  useEffect(() => {
    if (isLoadingSuggestedKeyFactors) return;
    if (suggestedKeyFactors.length === 0) return;

    setSuggestedKeyFactors((prev) => {
      const filtered = prev.filter(
        (kf) => isDriverDraft(kf) || isBaseRateDraft(kf)
      );

      if (filtered.length === prev.length) return prev;
      return filtered;
    });
  }, [
    isLoadingSuggestedKeyFactors,
    suggestedKeyFactors.length,
    setSuggestedKeyFactors,
  ]);

  const [editingSessions, setEditingSessions] = useState<EditingSession[]>([]);
  const editingIdRef = useRef(0);

  const prevLenRef = useRef(suggestedKeyFactors.length);

  useEffect(() => {
    const prevLen = prevLenRef.current;
    const currLen = suggestedKeyFactors.length;
    prevLenRef.current = currLen;

    const becameEmpty = prevLen > 0 && currLen === 0;

    if (
      becameEmpty &&
      !isLoadingSuggestedKeyFactors &&
      editingSessions.length === 0
    ) {
      setSelectedType(null);
    }
  }, [
    suggestedKeyFactors.length,
    isLoadingSuggestedKeyFactors,
    editingSessions.length,
    setSelectedType,
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

  const handleApplyEdit = (sessionId: number) => {
    const session = editingSessions.find((s) => s.id === sessionId);
    if (!session) return;
    reinsertIntoSuggestions(session.draft, session.index);
    removeEditingSession(sessionId);
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
    return [];
  });

  const showInitialLoader =
    isLoadingSuggestedKeyFactors && suggestedKeyFactors.length === 0;

  const showEmptyState =
    !showInitialLoader &&
    !isLoadingSuggestedKeyFactors &&
    suggestedKeyFactors.length === 0 &&
    editingSessions.length === 0;

  return (
    <KeyFactorsNewItemContainer
      icon={faRobot}
      label={t("generatedKeyFactors")}
      onBack={onBack}
      containerClassName="bg-purple-100 dark:bg-purple-100-dark min-h-[120px]"
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

      {!showInitialLoader && editingForms.length > 0 && (
        <div className="flex flex-col gap-4">{editingForms}</div>
      )}

      {!showInitialLoader && user && suggestedKeyFactors.length > 0 && (
        <KeyFactorsSuggestedItems
          post={postData}
          suggestedKeyFactors={suggestedKeyFactors}
          setSuggestedKeyFactors={setSuggestedKeyFactors}
          onEdit={handleEdit}
          user={user}
        />
      )}
    </KeyFactorsNewItemContainer>
  );
};

export default KeyFactorsAddInCommentLLMSuggestions;
