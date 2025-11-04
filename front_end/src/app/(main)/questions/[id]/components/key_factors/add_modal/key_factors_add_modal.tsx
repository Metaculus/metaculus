"use client";

import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, memo } from "react";

import BaseModal from "@/components/base_modal";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { BECommentType } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts } from "@/types/post";
import { User } from "@/types/users";

import KeyFactorsAddFormWithCtx from "./key_factors_add_form_with_ctx";
import KeyFactorsLoadingSuggested from "./key_factors_loading_suggested";
import { KeyFactorsProvider, useKeyFactorsCtx } from "../key_factors_context";
import { driverTextSchema } from "../schemas";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  user: User;
  // Used when adding key factors to an existing comment
  commentId?: number;
  // Used when adding key factors and also creating a new comment on a given post
  // This also determines the number of steps in the modal: 2 if a new comment is createad too
  post: PostWithForecasts;
  // if true, loads a set of suggested key factors
  showSuggestedKeyFactors?: boolean;
  onSuccess?: (comment: BECommentType) => void;
};

const Footer: React.FC<{
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  disabled: boolean;
  errors?: ErrorResponse;
}> = ({ isPending, onCancel, onSubmit, submitLabel, disabled, errors }) => (
  <div
    className={[
      "sticky -bottom-5 z-10",
      "-mx-5 px-5 py-3 md:-mx-7 md:px-7 md:pb-0 md:pt-6",
      "border-t border-blue-100/40",
      "bg-gray-0/80 backdrop-blur supports-[backdrop-filter]:bg-gray-0/60",
      "dark:bg-gray-0-dark/80 dark:supports-[backdrop-filter]:bg-gray-0-dark/60",
      "sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-0",
    ].join(" ")}
  >
    <div className="mt-0 flex w-full gap-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={onCancel}
        className="ml-auto"
        disabled={isPending}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={onSubmit}
        disabled={isPending || disabled}
      >
        {submitLabel}
      </Button>
    </div>
    <FormError errors={errors} detached />
  </div>
);

const ModalBody: React.FC<{
  post: PostWithForecasts;
  commentId?: number;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
}> = ({ post, commentId, onClose, onSuccess }) => {
  const t = useTranslations();
  const {
    isPending,
    submit,
    resetAll,
    errors,
    setErrors,
    markdown,
    setMarkdown,
    isLoadingSuggestedKeyFactors,
    drafts,
  } = useKeyFactorsCtx();

  const handleSubmitDriver = async () => {
    if (isNil(commentId) && !markdown) {
      setErrors(new Error(t("emptyCommentField")));
      return;
    }
    const result = await submit();
    if (result && "errors" in result) {
      setErrors(result.errors);
      return;
    }
    if (result?.comment) {
      onSuccess?.(result.comment);
    }
    resetAll();
    onClose();
  };

  const disableDriverSubmit =
    isPending ||
    (isNil(commentId) && !markdown) ||
    drafts.length === 0 ||
    drafts.some((d) => d.driver?.text.trim() === "") ||
    drafts.some((d) =>
      !d.driver || d.driver.text.trim() !== ""
        ? !driverTextSchema.safeParse(d.driver.text).success
        : false
    ) ||
    drafts.some(
      (d) =>
        d.driver &&
        d.driver.text.trim() !== "" &&
        d.driver.impact_direction === null &&
        d.driver.certainty !== -1
    );

  return (
    <>
      <h2 className="mb-6 mt-0 flex items-center gap-3 text-xl text-blue-500 dark:text-blue-500-dark">
        <span className="hidden sm:block">{t("addKeyFactors")}</span>
        <span className="sm:hidden">{t("add")}</span>
        <FontAwesomeIcon icon={faChevronRight} size="lg" className="text-lg" />
        <span className="text-gray-900 dark:text-gray-900-dark">
          {t("driver")}
        </span>
      </h2>

      {isLoadingSuggestedKeyFactors && <KeyFactorsLoadingSuggested />}

      {!isLoadingSuggestedKeyFactors && (
        <div className="flex max-w-xl grow flex-col gap-2">
          <KeyFactorsAddFormWithCtx post={post} />
          {/* Comment section */}
          <div className="flex w-full flex-col gap-2">
            <p className="my-2 text-base leading-tight sm:mt-6">
              {t("addDriverModalCommentDescription")}
            </p>
            <MemoMarkdownEditor
              mode="write"
              markdown={markdown}
              onChange={setMarkdown}
              className="border"
              contentEditableClassName="text-base sm:text-inherit"
            />
          </div>

          <Footer
            isPending={isPending}
            onCancel={() => {
              resetAll();
              onClose();
            }}
            onSubmit={handleSubmitDriver}
            submitLabel={t("addDriver")}
            disabled={disableDriverSubmit}
            errors={errors}
          />
        </div>
      )}
    </>
  );
};

const KeyFactorsAddModal: FC<Props> = ({
  isOpen,
  onClose,
  commentId,
  post,
  onSuccess,
  user,
  showSuggestedKeyFactors = true,
}) => {
  if (!isOpen || !user) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        onClose(true);
      }}
      isImmersive
      className="m-0 flex h-full w-full max-w-none flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto"
    >
      <KeyFactorsProvider
        user={user}
        post={post}
        commentId={commentId}
        suggest={showSuggestedKeyFactors && isOpen}
      >
        <ModalBody
          post={post}
          commentId={commentId}
          onClose={() => onClose(true)}
          onSuccess={onSuccess}
        />
      </KeyFactorsProvider>
    </BaseModal>
  );
};

// Prevent heavy MDXEditor re-renders when unrelated state (like driver input) changes
const MemoMarkdownEditor = memo(MarkdownEditor);

export default KeyFactorsAddModal;
