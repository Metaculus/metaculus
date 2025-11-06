"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { BECommentType } from "@/types/comment";
import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { isBaseRateDraft } from "@/utils/key_factors";
import { isQuestionPost } from "@/utils/questions/helpers";

import KeyFactorsNewBaseRate from "../../item_creation/base_rate/key_factors_new_base_rate";
import {
  createEmptyBaseRateDraft,
  validateBaseRateDraft,
} from "../../item_creation/base_rate/utils";
import { useKeyFactorsCtx } from "../../key_factors_context";
import KeyFactorsModalFooter from "../key_factors_modal_footer";

type Props = {
  post: PostWithForecasts;
  commentId?: number;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
};

const KeyFactorsBaseRateCreationBlock: React.FC<Props> = ({
  post,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations();
  const [showErrors, setShowErrors] = useState(false);
  const { isPending, submit, resetAll, errors, setErrors, drafts, setDrafts } =
    useKeyFactorsCtx();

  useEffect(() => {
    const first = drafts.find(isBaseRateDraft) as BaseRateDraft | undefined;
    if (first) {
      setDrafts([first]);
      return;
    }
    const initialUnit = (isQuestionPost(post) ? post.question.unit : "") ?? "";
    setDrafts([createEmptyBaseRateDraft(initialUnit)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draft = useMemo(() => drafts.find(isBaseRateDraft), [drafts]);
  const setDraft = (next: BaseRateDraft) => setDrafts([next]);

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!draft) {
      setErrors(new Error(t("pleaseAddAtLeastOneBaseRate")));
      return;
    }
    const r = validateBaseRateDraft(draft);
    if (!r.success) {
      return;
    }
    const result = await submit();
    if (result && "errors" in result) {
      setErrors(result.errors);
      return;
    }
    if (result?.comment) onSuccess?.(result.comment);
    resetAll();
    onClose();
  };

  return (
    <>
      {draft && (
        <KeyFactorsNewBaseRate
          draft={draft}
          setDraft={setDraft}
          post={post}
          showErrors={showErrors}
        />
      )}
      <KeyFactorsModalFooter
        isPending={isPending}
        onCancel={() => {
          resetAll();
          onClose();
        }}
        onSubmit={handleSubmit}
        submitLabel={t("addBaseRate")}
        disabled={isPending}
        errors={errors}
      />
    </>
  );
};

export default KeyFactorsBaseRateCreationBlock;
