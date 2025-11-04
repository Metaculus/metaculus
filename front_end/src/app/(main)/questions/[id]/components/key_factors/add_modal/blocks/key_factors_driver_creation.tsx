"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { memo } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import { useKeyFactorsCtx } from "../../key_factors_context";
import KeyFactorsAddFormWithCtx from "../key_factors_add_form_with_ctx";
import KeyFactorsModalFooter from "./key_factors_modal_footer";
import { driverTextSchema } from "../../schemas";

type Props = {
  post: PostWithForecasts;
  commentId?: number;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
};

const KeyFactorsDriverCreation: React.FC<Props> = ({
  post,
  commentId,
  onClose,
  onSuccess,
}) => {
  const t = useTranslations();
  const {
    isPending,
    submit,
    resetAll,
    errors,
    setErrors,
    markdown,
    setMarkdown,
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
      <KeyFactorsAddFormWithCtx post={post} />
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
      <KeyFactorsModalFooter
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
    </>
  );
};

// Prevent heavy MDXEditor re-renders when unrelated state (like driver input) changes
const MemoMarkdownEditor = memo(MarkdownEditor);

export default KeyFactorsDriverCreation;
