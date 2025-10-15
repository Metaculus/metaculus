"use client";
import {
  faChevronRight,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import DriverCreationForm from "@/app/(main)/questions/[id]/components/key_factors/add_modal/driver_creation_form";
import BaseModal from "@/components/base_modal";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { BECommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
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
  post: PostWithForecasts;
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

export const AddKeyFactorsForm = ({
  keyFactors,
  setKeyFactors,
  isActive,
  factorsLimit,
  limitError,
  suggestedKeyFactors,
  setSuggestedKeyFactors,
  post,
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
  post: PostWithForecasts;
}) => {
  const t = useTranslations();

  const totalKeyFactorsLimitReached =
    keyFactors.length +
      suggestedKeyFactors.filter((kf) => kf.selected).length >=
    Math.min(factorsLimit, FACTORS_PER_COMMENT);

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
                disabled={totalKeyFactorsLimitReached && !keyFactor.selected}
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
        <DriverCreationForm
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
          post={post}
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
            totalKeyFactorsLimitReached ||
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
  post,
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
    errors,
    setErrors,
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
    postId: post.id,
    suggestKeyFactors: showSuggestedKeyFactors && isOpen,
  });

  const handleOnClose = () => {
    setCurrentStep(1);
    clearState();
    onClose(true);
  };

  const handleSubmit = async () => {
    if (isNil(commentId) && !markdown) {
      setErrors(new Error(t("emptyCommentField")));
      return;
    }

    const result = await submit(keyFactors, suggestedKeyFactors, markdown);

    if (result && "errors" in result) {
      setErrors(result.errors);
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
      isOpen={isOpen}
      onClose={handleOnClose}
      isImmersive={true}
      className="m-0 flex h-full w-full max-w-none flex-col overscroll-contain rounded-none md:w-auto md:rounded lg:m-auto lg:h-auto"
    >
      <h2 className="mb-4 mt-0 flex items-center gap-3 text-xl text-blue-500 dark:text-blue-500-dark">
        <span>{t("addKeyFactors")}</span>
        <FontAwesomeIcon icon={faChevronRight} size="lg" className="text-lg" />
        <span className="text-gray-900 dark:text-gray-900-dark">
          {t("driver")}
        </span>
      </h2>

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
            post={post}
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
                disabled={isPending || (isNil(commentId) && !markdown)}
              >
                {t("submit")}
              </Button>
            )}
          </div>
          <FormError errors={errors} detached={true} />
        </div>
      )}
    </BaseModal>
  );
};

export default AddKeyFactorsModal;
