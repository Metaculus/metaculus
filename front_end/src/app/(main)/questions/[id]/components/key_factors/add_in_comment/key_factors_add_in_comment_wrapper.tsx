"use client";

import { PropsWithChildren } from "react";

import { CommentForm } from "../../comment_form";
import { useKeyFactorsCtx } from "../key_factors_context";

type Props = PropsWithChildren<{
  onSubmit: () => void;
  onCancel: () => void;
  disableSubmit?: boolean;
}>;

const KeyFactorsAddInCommentWrapper: React.FC<Props> = ({
  onSubmit,
  onCancel,
  children,
  disableSubmit = false,
}) => {
  const { isPending } = useKeyFactorsCtx();

  return (
    <CommentForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      cancelDisabled={isPending}
      submitDisabled={isPending || disableSubmit}
    >
      {children}
    </CommentForm>
  );
};

export default KeyFactorsAddInCommentWrapper;
