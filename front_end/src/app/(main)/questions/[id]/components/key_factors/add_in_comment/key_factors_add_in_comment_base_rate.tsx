"use client";

import { useMemo } from "react";

import { FormError } from "@/components/ui/form_field";
import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { isBaseRateDraft } from "@/utils/key_factors";

import KeyFactorsAddInCommentWrapper from "./key_factors_add_in_comment_wrapper";
import KeyFactorsBaseRateForm from "../item_creation/base_rate/key_factors_base_rate_form";
import { useKeyFactorsCtx } from "../key_factors_context";

type Props = {
  postData: PostWithForecasts;
  onSubmit: () => void;
  onCancel: () => void;
  showErrorsSignal?: number;
  onValidate?: (valid: boolean) => void;
};

const KeyFactorsAddInCommentBaseRate: React.FC<Props> = ({
  postData,
  onCancel,
  onSubmit,
  showErrorsSignal = 0,
  onValidate,
}) => {
  const { drafts, setDrafts, errors: keyFactorsErrors } = useKeyFactorsCtx();
  const draft = useMemo(() => drafts.find(isBaseRateDraft), [drafts]);
  const setDraft = (next: BaseRateDraft) => setDrafts([next]);

  if (!draft) return null;

  return (
    <KeyFactorsAddInCommentWrapper onSubmit={onSubmit} onCancel={onCancel}>
      <KeyFactorsBaseRateForm
        draft={draft}
        setDraft={setDraft}
        post={postData}
        showErrorsSignal={showErrorsSignal}
        onValidate={onValidate}
      />
      <FormError errors={keyFactorsErrors} />
    </KeyFactorsAddInCommentWrapper>
  );
};

export default KeyFactorsAddInCommentBaseRate;
