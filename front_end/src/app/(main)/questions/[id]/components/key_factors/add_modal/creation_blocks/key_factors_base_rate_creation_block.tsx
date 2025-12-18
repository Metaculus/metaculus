"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { BECommentType } from "@/types/comment";
import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { isBaseRateDraft } from "@/utils/key_factors";
import { isQuestionPost } from "@/utils/questions/helpers";

import KeyFactorsBaseRateForm from "../../item_creation/base_rate/key_factors_base_rate_form";
import { createEmptyBaseRateDraft } from "../../item_creation/base_rate/utils";
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
  const [showErrorsSignal, setShowErrorsSignal] = useState(0);
  const [lastValid, setLastValid] = useState(false);
  const { isPending, submit, resetAll, errors, setErrors, drafts, setDrafts } =
    useKeyFactorsCtx();

  useEffect(() => {
    setDrafts((prevDrafts) => {
      const existingBaseRate = prevDrafts.find(isBaseRateDraft) as
        | BaseRateDraft
        | undefined;

      const otherDrafts = prevDrafts.filter((d) => !isBaseRateDraft(d));

      if (existingBaseRate) {
        return [...otherDrafts, existingBaseRate];
      }

      const initialUnit =
        (isQuestionPost(post) ? post.question.unit : "") ?? "";
      const newBaseRate = createEmptyBaseRateDraft(initialUnit);

      return [...otherDrafts, newBaseRate];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draft = useMemo(() => drafts.find(isBaseRateDraft), [drafts]);
  const setDraft = (next: BaseRateDraft) => {
    setDrafts((prevDrafts) => {
      const otherDrafts = prevDrafts.filter((d) => !isBaseRateDraft(d));
      return [...otherDrafts, next];
    });
  };

  const handleSubmit = async () => {
    setShowErrorsSignal((n) => n + 1);
    if (!draft) {
      setErrors(new Error(t("pleaseAddAtLeastOneBaseRate")));
      return;
    }
    queueMicrotask(async () => {
      if (!lastValid) return;
      const result = await submit("base_rate");
      if (result && "errors" in result) {
        setErrors(result.errors);
        return;
      }
      if (result?.comment) onSuccess?.(result.comment);
      resetAll();
      onClose();
    });
  };

  return (
    <>
      {draft && (
        <KeyFactorsBaseRateForm
          draft={draft}
          setDraft={setDraft}
          post={post}
          showErrorsSignal={showErrorsSignal}
          onValidate={setLastValid}
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
