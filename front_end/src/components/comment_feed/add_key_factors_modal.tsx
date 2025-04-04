"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import {
  addKeyFactorsToComment,
  createComment
} from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { BECommentType } from "@/types/comment";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  onSuccess: (response: BECommentType) => void;
};

const Step2AddComment = ({
  markdown,
  setMarkdown,
}: {
  markdown: string;
  setMarkdown: (markdown: string) => void;
}) => {
  return (
    <div className="mt-8 flex w-full flex-col gap-4 border">
      <MarkdownEditor mode="write" markdown={markdown} onChange={setMarkdown} />
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
    <div className="mt-8 flex w-full flex-col gap-4">
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
          showXButton={idx > 0}
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
          disabled={keyFactors.at(-1) === ""}
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

  const onSubmit = async () => {
    let response;

    if (commentId) {
      response = await addKeyFactorsToComment(commentId, keyFactors);
    } else {
      response = await createComment({
        on_post: postId,
        text: markdown,
        key_factors: keyFactors,
        is_private: false,
      });
    }

    if ("errors" in response) {
      const errors = response.errors;
      setErrorMessage(errors?.message ?? errors?.non_field_errors?.[0]);
      return;
    }

    onSuccess(response);
  };

  const handleOnClose = () => {
    setKeyFactors([]);
    setMarkdown("");
    setCurrentStep(1);
    onClose(true);
  };

  return (
    <BaseModal
      label={t("addKeyFactors")}
      isOpen={isOpen}
      onClose={handleOnClose}
      className=""
    >
      <div className="max-w-xl">
        <p className="text-base leading-tight">{t("addKeyFactorsModalP1")}</p>
        <p className="text-base leading-tight">{t("addKeyFactorsModalP2")}</p>

        <Step1AddKeyFactors
          keyFactors={keyFactors}
          setKeyFactors={setKeyFactors}
          isActive={currentStep === 1}
        />

        {currentStep > 1 && (
          <Step2AddComment markdown={markdown} setMarkdown={setMarkdown} />
        )}

        <div className="mt-6 flex w-full gap-2">
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
            >
              {t("next")}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="xs"
              onClick={() => {
                onSubmit();
              }}
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
