"use client";

import { useEffect, useRef, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { useAuth } from "@/contexts/auth_context";
import { CommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import KeyFactorsSuggestedItems from "../item_creation/driver/key_factors_suggested_items";
import { INITIAL_DRAFTS, useKeyFactorsCtx } from "../key_factors_context";
import KeyFactorsTypePicker from "../key_factors_type_picker";
import { KFType } from "../types";
import KeyFactorsAddInCommentBaseRate from "./key_factors_add_in_comment_base_rate";
import KeyFactorsAddInCommentDriver from "./key_factors_add_in_comment_driver";

type Props = {
  postData: PostWithForecasts;
  onAfterCommentSubmit?: () => void;
  closeKeyFactorsForm?: () => void;
};

const KeyFactorsAddInComment: React.FC<Props> = ({
  postData,
  onAfterCommentSubmit,
  closeKeyFactorsForm,
}) => {
  const [selectedType, setSelectedType] = useState<KFType>(null);
  const { user, setUser } = useAuth();

  const {
    drafts,
    suggestedKeyFactors,
    isLoadingSuggestedKeyFactors,
    setSuggestedKeyFactors,
    setErrors: setKeyFactorsErrors,
    submit,
    resetAll,
    setDrafts,
  } = useKeyFactorsCtx();
  const { comments, setComments } = useCommentsFeed();

  useEffect(() => {
    if (selectedType && selectedType !== "driver") setSuggestedKeyFactors([]);
  }, [selectedType, setSuggestedKeyFactors]);

  const [brShowErrorsSignal, setBrShowErrorsSignal] = useState(0);
  const brIsValidRef = useRef(false);

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
    const result = await submit();
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

    const result = await submit();
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

  const onCancel = () => {
    closeKeyFactorsForm?.();
    resetAll();
    setDrafts(INITIAL_DRAFTS);
  };

  return (
    <>
      {user && suggestedKeyFactors.length > 0 && (
        <KeyFactorsSuggestedItems
          drafts={drafts}
          post={postData}
          setDrafts={setDrafts}
          setSuggestedKeyFactors={setSuggestedKeyFactors}
          setSelectedType={setSelectedType}
          selectedType={selectedType}
          suggestedKeyFactors={suggestedKeyFactors}
          user={user}
        />
      )}

      {!selectedType && !isLoadingSuggestedKeyFactors && (
        <KeyFactorsTypePicker onPick={setSelectedType} />
      )}

      {selectedType === "driver" && (
        <KeyFactorsAddInCommentDriver
          postData={postData}
          onSubmit={handleSubmitDriver}
          onCancel={onCancel}
        />
      )}

      {selectedType === "base_rate" && (
        <KeyFactorsAddInCommentBaseRate
          postData={postData}
          onSubmit={handleSubmitBaseRate}
          onCancel={onCancel}
          showErrorsSignal={brShowErrorsSignal}
          onValidate={(ok) => {
            brIsValidRef.current = ok;
          }}
        />
      )}
    </>
  );
};

function updateCommentKeyFactors(
  comment: CommentType,
  targetId: number,
  newKeyFactors: KeyFactor[]
): CommentType {
  if (comment.id === targetId) {
    return { ...comment, key_factors: newKeyFactors };
  }
  if (comment.children?.length) {
    return {
      ...comment,
      children: comment.children.map((child) =>
        updateCommentKeyFactors(child, targetId, newKeyFactors)
      ),
    };
  }
  return comment;
}

export default KeyFactorsAddInComment;
