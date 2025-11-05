"use client";

import { useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { useAuth } from "@/contexts/auth_context";
import { CommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import Stub from "../add_modal/stub";
import KeyFactorsTypePicker from "../key_factors_type_picker";
import { KFType } from "../types";
import KeyFactorsAddInCommentDriver from "./key_factors_add_in_comment_driver";
import { useKeyFactorsCtx } from "../key_factors_context";

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
    setErrors: setKeyFactorsErrors,
    submit,
    resetAll,
    setDrafts,
  } = useKeyFactorsCtx();
  const { comments, setComments } = useCommentsFeed();

  const handleSubmit = async () => {
    const result = await submit();
    if (result && "errors" in result) {
      setKeyFactorsErrors(result.errors);
      return;
    }
    if (result?.comment) {
      const newComment = result.comment;

      if (user && !user.should_suggest_keyfactors) {
        // Update the user state so now the user can get suggested key factors
        setUser({ ...user, should_suggest_keyfactors: true });
      }

      const updatedComments = comments.map((comment) =>
        updateCommentKeyFactors(
          comment,
          newComment.id,
          newComment.key_factors ?? []
        )
      );

      resetAll();
      setComments(updatedComments);
      onAfterCommentSubmit?.();
    }
    closeKeyFactorsForm?.();
  };

  const onCancel = () => {
    closeKeyFactorsForm?.();
    resetAll();
    setDrafts([
      { driver: { text: "", impact_direction: null, certainty: null } },
    ]);
  };

  return (
    <>
      {!selectedType ? (
        <KeyFactorsTypePicker onPick={setSelectedType} />
      ) : selectedType === "driver" ? (
        <KeyFactorsAddInCommentDriver
          postData={postData}
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />
      ) : (
        <Stub selectedType={selectedType} />
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
    return {
      ...comment,
      key_factors: newKeyFactors,
    };
  }

  if (comment.children && comment.children.length > 0) {
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
