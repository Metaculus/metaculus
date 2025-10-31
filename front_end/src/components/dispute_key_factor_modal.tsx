"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { replyToComment } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import type { CommentType } from "@/types/comment";
import { parseComment } from "@/utils/comments";
import cn from "@/utils/core/cn";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  parentCommentId: number;
  postId: number;
  onOptimisticAdd: (text: string) => number | Promise<number>;
  onFinalize: (tempId: number, real: CommentType) => void;
  onRemove: (tempId: number) => void;
};

const scrollIntoViewById = (domId: string, opts?: ScrollIntoViewOptions) => {
  const el = document.getElementById(domId);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "center", ...opts });
};

const DisputeKeyFactorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  parentCommentId,
  postId,
  onOptimisticAdd,
  onFinalize,
  onRemove,
}) => {
  const t = useTranslations();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);

    let tempId: number | null = null;

    try {
      tempId = await onOptimisticAdd(text);
      const be = await replyToComment(parentCommentId, postId, text);
      const real: CommentType = { ...parseComment(be), children: [] };
      setTimeout(() => scrollIntoViewById(`comment-${real.id}`), 40);
      onClose();

      onFinalize(tempId, real);
    } catch {
      if (tempId !== null) onRemove(tempId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-[560px] p-[28px]"
      closeButtonClassName="hidden"
    >
      <div className="mb-6 flex w-full items-center justify-between">
        <h2 className="m-0 text-2xl text-blue-900 dark:text-blue-900-dark">
          {t("disputeKeyFactor")}
        </h2>
        <button
          onClick={() => onClose()}
          className={cn(
            "text-2xl text-blue-800 no-underline opacity-50 hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
          )}
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <p className="mb-6 mt-0 text-sm text-gray-700 dark:text-gray-700-dark">
        {t("disputeKeyFactorHelp")}
      </p>
      <div className="mb-6">
        <MarkdownEditor
          markdown={text}
          mode="write"
          onChange={setText}
          contentEditableClassName="min-h-[160px]"
          className="rounded border border-gray-300 dark:border-gray-300-dark"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="tertiary" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={submit}
          disabled={!text.trim() || busy}
        >
          {busy ? t("posting") : t("postComment")}
        </Button>
      </div>
    </BaseModal>
  );
};

export default DisputeKeyFactorModal;
