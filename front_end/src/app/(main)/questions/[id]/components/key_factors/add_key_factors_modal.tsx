"use client";
import {
  faChevronRight,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, memo, useState } from "react";

import DriverCreationForm from "@/app/(main)/questions/[id]/components/key_factors/add_modal/driver_creation_form";
import BaseModal from "@/components/base_modal";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { BECommentType } from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import { User } from "@/types/users";

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

// Prevent heavy MDXEditor re-renders when unrelated state (like driver input) changes
const MemoMarkdownEditor = memo(MarkdownEditor);

export const AddKeyFactorsForm = ({
  drafts,
  setDrafts,
  factorsLimit,
  limitError,
  suggestedKeyFactors,
  setSuggestedKeyFactors,
  post,
}: {
  drafts: KeyFactorDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<KeyFactorDraft[]>>;
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
    drafts.length + suggestedKeyFactors.filter((kf) => kf.selected).length >=
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

      <div className="flex flex-col gap-3">
        {suggestedKeyFactors.length === 0 && (
          <p className="m-0 mb-2 text-base leading-tight">
            {t("addDriverModalDescription")}
          </p>
        )}

        {drafts.map((draft, idx) => (
          <DriverCreationForm
            key={idx}
            draft={draft}
            setDraft={(d) =>
              setDrafts(drafts.map((k, i) => (i === idx ? d : k)))
            }
            showXButton={idx > 0}
            onXButtonClick={() => {
              setDrafts(drafts.filter((_, i) => i !== idx));
            }}
            post={post}
          />
        ))}

        <Button
          variant="tertiary"
          size="xs"
          className="w-fit gap-2 px-3 py-2 text-sm font-medium !leading-none sm:text-base"
          onClick={() => {
            setDrafts([
              ...drafts,
              {
                kind: "whole",
                driver: { text: "", impact_direction: 1, certainty: null },
              },
            ]);
          }}
          disabled={
            totalKeyFactorsLimitReached ||
            drafts.at(-1)?.driver.text === "" ||
            !isNil(limitError)
          }
        >
          <FontAwesomeIcon icon={faPlus} className="size-4" />
          {t("addAnother")}
        </Button>
      </div>
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
  const [markdown, setMarkdown] = useState<string>("");
  const [drafts, setDrafts] = useState<KeyFactorDraft[]>([
    {
      kind: "whole",
      driver: { text: "", impact_direction: 1, certainty: null },
    },
  ]);

  const {
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

  const resetAll = () => {
    setDrafts([
      {
        kind: "whole",
        driver: { text: "", impact_direction: 1, certainty: null },
      },
    ]);
    setMarkdown("");
    setErrors(undefined);
    clearState();
  };

  const handleOnClose = () => {
    resetAll();
    onClose(true);
  };

  const handleSubmit = async () => {
    if (isNil(commentId) && !markdown) {
      setErrors(new Error(t("emptyCommentField")));
      return;
    }

    const result = await submit(drafts, suggestedKeyFactors, markdown);

    if (result && "errors" in result) {
      setErrors(result.errors);
      return;
    }
    resetAll();
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
      <h2 className="mb-6 mt-0 flex items-center gap-3 text-xl text-blue-500 dark:text-blue-500-dark">
        <span className="hidden sm:block">{t("addKeyFactors")}</span>
        <span className="sm:hidden">{t("add")}</span>
        <FontAwesomeIcon icon={faChevronRight} size="lg" className="text-lg" />
        <span className="text-gray-900 dark:text-gray-900-dark">
          {t("driver")}
        </span>
      </h2>

      {isLoadingSuggestedKeyFactors && <LoadingSuggestedKeyFactors />}

      {!isLoadingSuggestedKeyFactors && (
        <div className="flex max-w-xl grow flex-col gap-2">
          <AddKeyFactorsForm
            drafts={drafts}
            setDrafts={setDrafts}
            factorsLimit={factorsLimit}
            limitError={limitError}
            suggestedKeyFactors={suggestedKeyFactors}
            setSuggestedKeyFactors={setSuggestedKeyFactors}
            post={post}
          />

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
            />
          </div>

          <div className="mt-auto flex w-full gap-3 md:mt-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOnClose}
              className="ml-auto"
              disabled={isPending}
            >
              {t("cancel")}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={
                isPending ||
                (isNil(commentId) && !markdown) ||
                drafts.length === 0 ||
                !!drafts.find((obj) => !obj.driver.text)
              }
            >
              {t("addDriver")}
            </Button>
          </div>
          <FormError errors={errors} detached={true} />
        </div>
      )}
    </BaseModal>
  );
};

export default AddKeyFactorsModal;
