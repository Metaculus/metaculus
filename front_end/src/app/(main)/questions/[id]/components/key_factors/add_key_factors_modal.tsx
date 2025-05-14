"use client";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import BaseModal from "@/components/base_modal";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { BECommentType } from "@/types/comment";
import { User } from "@/types/users";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { useKeyFactors } from "./hooks";

const FACTORS_PER_COMMENT = 4;

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  user: User;
  // Used when adding key factors to an existing comment
  commentId?: number;
  // Used when adding key factors and also creating a new comment on a given post
  // This also determines the number of steps in the modal: 2 if a new comment is createad too
  postId?: number;
  // if true, loads a set of suggested key factors
  showSuggestedKeyFactors?: boolean;
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
        className="grow rounded bg-gray-0 px-3 py-2 text-base dark:bg-gray-0-dark"
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

export const AddKeyFactorsForm = ({
  keyFactors,
  setKeyFactors,
  isActive,
  factorsLimit,
  limitError,
  suggestedKeyFactors,
  setSuggestedKeyFactors,
}: {
  keyFactors: string[];
  setKeyFactors: (factors: string[]) => void;
  isActive: boolean;
  limitError?: string;
  factorsLimit: number;
  suggestedKeyFactors: { text: string; selected: boolean }[];
  setSuggestedKeyFactors: (
    factors: { text: string; selected: boolean }[]
  ) => void;
}) => {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col gap-4">
      {suggestedKeyFactors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-base leading-tight">
            {t("suggestedKeyFactorsSection")}
          </p>
          {suggestedKeyFactors.map((keyFactor) => (
            <div
              key={keyFactor.text}
              className="flex grow items-center justify-between rounded border px-3 py-2 text-base"
            >
              <span>{keyFactor.text}</span>
              <Button
                variant={keyFactor.selected ? "primary" : "tertiary"}
                size="xs"
                className="h-fit w-fit"
                onClick={() => {
                  setSuggestedKeyFactors(
                    suggestedKeyFactors.map((kf) =>
                      kf.text === keyFactor.text
                        ? { ...kf, selected: !kf.selected }
                        : kf
                    )
                  );
                }}
              >
                <FontAwesomeIcon
                  icon={keyFactor.selected ? faMinus : faPlus}
                  className="size-4 p-1"
                />
                <span className="capitalize">
                  {keyFactor.selected ? t("remove") : t("add")}
                </span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {suggestedKeyFactors.length === 0 && (
        <p className="text-base leading-tight">{t("addKeyFactorsModalP1")}</p>
      )}

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
          disabled={
            keyFactors.length >= Math.min(factorsLimit, FACTORS_PER_COMMENT) ||
            keyFactors.at(-1) === "" ||
            !isNil(limitError)
          }
        >
          <FontAwesomeIcon icon={faPlus} className="size-4 p-1" />
          {t("addKeyFactor")}
        </Button>
      )}
    </div>
  );
};

const LoadingSuggestedKeyFactors = () => {
  const t = useTranslations();
  return (
    <div className="flex w-full grow flex-col items-center justify-center gap-2 md:w-[576px]">
      <p className="text-base leading-tight">
        {t("loadingSuggestedKeyFactors")}
      </p>
      <LoadingSpinner />
    </div>
  );
};

const AddKeyFactorsModal: FC<Props> = ({
  isOpen,
  onClose,
  commentId,
  postId,
  onSuccess,
  user,
  showSuggestedKeyFactors = false,
}) => {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const numberOfSteps = commentId ? 1 : 2;
  const [markdown, setMarkdown] = useState<string>("");

  const {
    keyFactors,
    setKeyFactors,
    errorMessage,
    setErrorMessage,
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,
    limitError,
    factorsLimit,
    submit,
    isPending,
    clearState,
  } = useKeyFactors({
    user_id: user.id,
    commentId,
    postId,
    suggestKeyFactors: showSuggestedKeyFactors && isOpen,
  });

  const handleOnClose = () => {
    clearState();
    onClose(true);
  };

  const handleSubmit = async () => {
    const result = await submit(keyFactors, suggestedKeyFactors, markdown);
    if (result?.error) {
      setErrorMessage(result.error);
      return;
    }
    clearState();
    if (result?.comment) {
      onSuccess?.(result.comment);
    }
    onClose(true);
  };
  return (
    <BaseModal
      label={t("addKeyFactors")}
      isOpen={isOpen}
      onClose={handleOnClose}
      isImmersive={true}
      className="m-0 flex h-full w-full max-w-none flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto"
    >
      {isLoadingSuggestedKeyFactors && <LoadingSuggestedKeyFactors />}

      {!isLoadingSuggestedKeyFactors && (
        <div className="flex max-w-xl grow flex-col gap-2">
          <AddKeyFactorsForm
            keyFactors={keyFactors}
            setKeyFactors={setKeyFactors}
            isActive={currentStep === 1}
            factorsLimit={factorsLimit}
            limitError={limitError}
            suggestedKeyFactors={suggestedKeyFactors}
            setSuggestedKeyFactors={setSuggestedKeyFactors}
          />

          {currentStep > 1 && (
            <Step2AddComment markdown={markdown} setMarkdown={setMarkdown} />
          )}

          <div className="mt-auto flex w-full gap-3 md:mt-6">
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
                size="sm"
                onClick={() => {
                  sendAnalyticsEvent("addKeyFactor", {
                    event_label: "fromList",
                    event_category: "next",
                  });
                  setCurrentStep(currentStep + 1);
                }}
                className="px-3"
                disabled={isPending || !keyFactors.some((k) => k.trim() !== "")}
              >
                {t("next")}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {t("submit")}
              </Button>
            )}
          </div>
          {errorMessage && (
            <p className="text-sm text-red-500">{errorMessage}</p>
          )}
        </div>
      )}
    </BaseModal>
  );
};

export default AddKeyFactorsModal;
