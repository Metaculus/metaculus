"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { memo } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { isDriverDraft } from "@/utils/key_factors";

import KeyFactorsDriverAdditionForm from "../../item_creation/driver/key_factors_driver_addition_form";
import { useKeyFactorsCtx } from "../../key_factors_context";
import { driverTextSchema } from "../../schemas";
import KeyFactorsModalFooter from "../key_factors_modal_footer";

type Props = {
  post: PostWithForecasts;
  commentId?: number;
  onClose: () => void;
  onSuccess?: (c: BECommentType) => void;
};

const KeyFactorsDriverCreationBlock: React.FC<Props> = ({
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
    const result = await submit("driver");
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

  const driverDrafts = drafts.filter(isDriverDraft);
  const disableDriverSubmit =
    isPending ||
    (isNil(commentId) && !markdown) ||
    driverDrafts.length === 0 ||
    driverDrafts.some((d) => d.driver.text.trim() === "") ||
    driverDrafts.some(
      (d) => !driverTextSchema.safeParse(d.driver.text).success
    ) ||
    driverDrafts.some(
      (d) =>
        d.driver.text.trim() !== "" &&
        d.driver.impact_direction === null &&
        d.driver.certainty !== -1
    );

  return (
    <>
      <KeyFactorsDriverAdditionForm post={post} />
      <div className="flex w-full flex-col gap-2">
        <p className="my-2 hidden text-base leading-tight sm:mt-6 sm:block">
          {t("addDriverModalCommentDescriptionDesktop")}
        </p>
        <p className="my-2 text-base leading-tight sm:mt-6 sm:hidden">
          {t("addDriverModalCommentDescriptionMobile")}
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

export default KeyFactorsDriverCreationBlock;
