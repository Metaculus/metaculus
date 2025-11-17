"use client";

import { faRobot } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";

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

  const [editingDraft, setEditingDraft] = useState<KeyFactorDraft | null>(null);
  const [editingOriginalDraft, setEditingOriginalDraft] =
    useState<KeyFactorDraft | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const setSuggestedWithSideEffects: typeof setSuggestedKeyFactors = (
    updater
  ) => {
    setSuggestedKeyFactors((prev) => {
      const next =
        typeof updater === "function"
          ? (updater as (p: KeyFactorDraft[]) => KeyFactorDraft[])(prev)
          : updater;

      if (next.length === 0 && !editingDraft) {
        setSelectedType(null);
      }

      return next;
    });
  };

  const handleEdit = (kf: KeyFactorDraft, idx: number) => {
    setEditingOriginalDraft(kf);
    setEditingDraft(kf);
    setEditingIndex(idx);
    setSuggestedKeyFactors((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetEditing = () => {
    setEditingDraft(null);
    setEditingOriginalDraft(null);
    setEditingIndex(null);
  };

  const reinsertIntoSuggestions = (draftToInsert: KeyFactorDraft | null) => {
    if (!draftToInsert) return;

    setSuggestedWithSideEffects((prev) => {
      const next = [...prev];
      const idx =
        editingIndex === null
          ? next.length
          : Math.min(editingIndex, next.length);
      next.splice(idx, 0, draftToInsert);
      return next;
    });
  };

  const handleApplyEdit = () => {
    if (!editingDraft) return;
    reinsertIntoSuggestions(editingDraft);
    resetEditing();
  };

  const handleDiscardEdit = () => {
    reinsertIntoSuggestions(editingOriginalDraft);
    resetEditing();
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

  const renderEditingBlock = (content: ReactNode) => (
    <div className="relative">
      <EditingToolbar onApply={handleApplyEdit} onDiscard={handleDiscardEdit} />
      {content}
    </div>
  );

  let editingForm: ReactNode = null;

  if (editingDraft && isDriverDraft(editingDraft)) {
    editingForm = renderEditingBlock(
      <KeyFactorsNewDriverFields
        draft={editingDraft}
        setDraft={(next) => setEditingDraft(next)}
        showXButton={false}
        onXButtonClick={handleDiscardEdit}
        post={postData}
      />
    );
  } else if (editingDraft && isBaseRateDraft(editingDraft)) {
    editingForm = renderEditingBlock(
      <KeyFactorsBaseRateForm
        draft={editingDraft}
        setDraft={(next) => setEditingDraft(next)}
        post={postData}
      />
    );
  }

  const showInitialLoader =
    isLoadingSuggestedKeyFactors && suggestedKeyFactors.length === 0;

  const showEmptyState =
    !showInitialLoader &&
    !isLoadingSuggestedKeyFactors &&
    suggestedKeyFactors.length === 0 &&
    !editingDraft;

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

      {!showInitialLoader && editingForm}

      {!showInitialLoader && user && suggestedKeyFactors.length > 0 && (
        <KeyFactorsSuggestedItems
          post={postData}
          suggestedKeyFactors={suggestedKeyFactors}
          setSuggestedKeyFactors={setSuggestedWithSideEffects}
          onEdit={handleEdit}
          user={user}
        />
      )}
    </KeyFactorsNewItemContainer>
  );
};

export default KeyFactorsAddInCommentLLMSuggestions;
