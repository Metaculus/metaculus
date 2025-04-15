"use client";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import {
  addKeyFactorsToComment,
  createComment,
} from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { useServerAction } from "@/hooks/use_server_action";
import { BECommentType } from "@/types/comment";

import MarkdownEditor from "../markdown_editor";
import { Input } from "../ui/form_field";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  // Used when adding key factors to an existing comment
  commentId?: number;
  // Used when adding key factors and also creating a new comment on a given post
  // This also determines the number of steps in the modal: 2 if a new comment is createad too
  postId?: number;
  onSuccess?: (comment: BECommentType) => void;
};

const Step2AddComment = ({
  markdown,
  setMarkdown,
}: {
  markdown: string;
  setMarkdown: (markdown: string) => void;
}) => {
  const t = useTranslations();
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-base leading-tight">{t("addKeyFactorsModalP2")}</p>
      <MarkdownEditor
        mode="write"
        markdown={markdown}
        onChange={setMarkdown}
        className="border"
      />
    </div>
  );
};

const KeyFactorField = ({
  keyFactor,
  setKeyFactor,
  isActive,
  showXButton,
  onXButtonClick,
}: {
  keyFactor: string;
  setKeyFactor: (keyFactor: string) => void;
  isActive: boolean;
  showXButton: boolean;
  onXButtonClick: () => void;
}) => {
  const t = useTranslations();

  return (
    <div className="flex gap-2">
      <Input
        value={keyFactor}
        placeholder={t("typeKeyFator")}
        onChange={(e) => setKeyFactor(e.target.value)}
        className="grow"
        readOnly={!isActive}
        maxLength={150}
      />
      {showXButton && (
        <Button
          variant="text"
          size="xs"
          className="w-fit"
          onClick={onXButtonClick}
        >
          <FontAwesomeIcon icon={faCircleXmark} className="size-4 p-1" />
        </Button>
      )}
    </div>
  );
};

// TODO: add limit of 6 key factors per question when BE changes will be implemented
const Step1AddKeyFactors = ({
  keyFactors,
  setKeyFactors,
  isActive,
}: {
  keyFactors: string[];
  setKeyFactors: (factors: string[]) => void;
  isActive: boolean;
}) => {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col gap-4">
      {keyFactors.map((keyFactor, idx) => (
        <KeyFactorField
          key={idx}
          keyFactor={keyFactor}
          setKeyFactor={(keyFactor) => {
            setKeyFactors(
              keyFactors.map((k, i) => (i === idx ? keyFactor : k))
            );
          }}
          isActive={isActive}
          showXButton={idx > 0 && isActive}
          onXButtonClick={() => {
            setKeyFactors(keyFactors.filter((_, i) => i !== idx));
          }}
        />
      ))}

      {isActive && (
        <Button
          variant="secondary"
          size="xs"
          className="w-fit"
          onClick={() => {
            setKeyFactors([...keyFactors, ""]);
          }}
          disabled={keyFactors.length > 3 && keyFactors.at(-1) === ""}
        >
          <FontAwesomeIcon icon={faPlus} className="size-4 p-1" />
          {t("addKeyFactor")}
        </Button>
      )}
    </div>
  );
};

const AddKeyFactorsModal: FC<Props> = ({
  isOpen,
  onClose,
  commentId,
  postId,
  onSuccess,
}) => {
  const t = useTranslations();
  const [keyFactors, setKeyFactors] = useState<string[]>([""]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const numberOfSteps = commentId ? 1 : 2;
  const [markdown, setMarkdown] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const { comments, setComments, combinedKeyFactors, setCombinedKeyFactors } =
    useCommentsFeed();

  const clearState = () => {
    setKeyFactors([""]);
    setMarkdown("");
    setCurrentStep(1);
  };
  const onSubmit = async () => {
    let comment;

    if (commentId) {
      comment = await addKeyFactorsToComment(commentId, keyFactors);
    } else {
      comment = await createComment({
        on_post: postId,
        text: markdown,
        key_factors: keyFactors,
        is_private: false,
      });
    }

    if ("errors" in comment) {
      const errors = comment.errors;
      setErrorMessage(errors?.message ?? errors?.non_field_errors?.[0]);
      return;
    }

    // Only add new key factors to the combinedKeyFactors array if they don't already exist
    setCombinedKeyFactors([
      ...(comment.key_factors?.filter(
        (kf) => !combinedKeyFactors.some((existing) => existing.id === kf.id)
      ) ?? []),
      ...combinedKeyFactors,
    ]);

    if (!commentId) {
      // Only add the new comment to the comments array if it's a new comment
      setComments([{ ...comment, children: [] }, ...comments]);
    }

    clearState();
    onClose(true);
    onSuccess?.(comment);
  };

  const handleOnClose = () => {
    onClose(true);
    clearState();
  };
  const [submit, isPending] = useServerAction(onSubmit);

  return (
    <BaseModal
      label={t("addKeyFactors")}
      isOpen={isOpen}
      onClose={handleOnClose}
      isImmersive={true}
      className="m-0 flex h-full w-full max-w-none flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto"
    >
      <div className="flex max-w-xl grow flex-col gap-2">
        <p className="text-base leading-tight">{t("addKeyFactorsModalP1")}</p>

        <Step1AddKeyFactors
          keyFactors={keyFactors}
          setKeyFactors={setKeyFactors}
          isActive={currentStep === 1}
        />

        {currentStep > 1 && (
          <Step2AddComment markdown={markdown} setMarkdown={setMarkdown} />
        )}

        <div className="mt-auto flex w-full gap-2 lg:mt-6">
          {currentStep > 1 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="ml-auto"
            >
              {t("back")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOnClose}
              className="ml-auto"
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
          )}

          {currentStep < numberOfSteps ? (
            <Button
              variant="primary"
              size="xs"
              onClick={() => setCurrentStep(currentStep + 1)}
              className="px-4"
              disabled={isPending || keyFactors.at(-1) === ""}
            >
              {t("next")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="xs"
              onClick={submit}
              disabled={isPending}
            >
              {t("submit")}
            </Button>
          )}
        </div>
        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
    </BaseModal>
  );
};

export default AddKeyFactorsModal;
