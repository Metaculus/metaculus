"use client";
import { useMemo } from "react";

import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { isBaseRateDraft } from "@/utils/key_factors";

import KeyFactorsAddInCommentWrapper from "./key_factors_add_in_comment_wrapper";
import KeyFactorsNewBaseRate from "../item_creation/base_rate/key_factors_new_base_rate";
import { useKeyFactorsCtx } from "../key_factors_context";

type Props = {
  postData: PostWithForecasts;
  onSubmit: () => void;
  onCancel: () => void;
};

const KeyFactorsAddInCommentBaseRate: React.FC<Props> = ({
  postData,
  onCancel,
  onSubmit,
}) => {
  const { drafts, setDrafts } = useKeyFactorsCtx();
  const draft = useMemo(() => drafts.find(isBaseRateDraft), [drafts]);
  const setDraft = (next: BaseRateDraft) => setDrafts([next]);

  if (!draft) {
    return null;
  }

  return (
    <KeyFactorsAddInCommentWrapper onSubmit={onSubmit} onCancel={onCancel}>
      <KeyFactorsNewBaseRate
        draft={draft}
        setDraft={setDraft}
        post={postData}
      />
    </KeyFactorsAddInCommentWrapper>
  );
};

export default KeyFactorsAddInCommentBaseRate;
