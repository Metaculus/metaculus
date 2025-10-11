import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import {
  useState,
  useEffect,
  forwardRef,
  Ref,
  useImperativeHandle,
} from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { createCoherenceLink } from "@/app/(main)/questions/actions";
import { DirectionSelect } from "@/app/(main)/questions/components/coherence_links/direction_select_component";
import LinkStrengthSelectorComponent from "@/app/(main)/questions/components/coherence_links/link_strength_selector_component";
import QuestionPicker, {
  SearchedQuestionType,
} from "@/app/(main)/questions/components/question_picker";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { LinkTypes } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question, QuestionType } from "@/types/question";

type Props = {
  post: Post;
  linkKey: number;
  deleteLink: (key: number) => Promise<void>;
  suggestedOtherQuestion?: Question;
  shouldDisplayDelete?: boolean;
  shouldDisplaySave?: boolean;
};

export type CreateCoherenceLinkRefType = {
  save: () => Promise<boolean>;
};

enum LinkCreationErrors {
  questionPairExists = "questionPairExists",
  questionMustDiffer = "questionMustDiffer",
}

const CreateCoherenceLink = (
  {
    post,
    linkKey,
    deleteLink,
    suggestedOtherQuestion,
    shouldDisplayDelete,
    shouldDisplaySave,
  }: Props,
  forwardedRef: Ref<CreateCoherenceLinkRefType>
) => {
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);
  const [direction, setDirection] = useState<number>(1);
  const [strength, setStrength] = useState<number>(2);
  const [otherQuestion, setOtherQuestion] = useState<Question | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerInitialSearch, setPickerInitialSearch] = useState<string>("");
  const [validationErrors, setValidationErrors] =
    useState<LinkCreationErrors | null>(null);
  const { updateCoherenceLinks } = useCoherenceLinksContext();
  const t = useTranslations();

  useEffect(() => {
    if (suggestedOtherQuestion)
      void otherQuestionSelected(suggestedOtherQuestion);
  }, [suggestedOtherQuestion]);

  function getLinkCreationError(constraintName: string | null) {
    switch (constraintName) {
      case "different_questions":
        return LinkCreationErrors.questionMustDiffer;
      case "unique_user_question_pair":
        return LinkCreationErrors.questionPairExists;
      default:
        return null;
    }
  }

  async function saveQuestionLink() {
    let question1: Question | null;
    let question2: Question | null;
    const postQuestion = post.question;

    if (!postQuestion || !otherQuestion) return null;

    if (isFirstQuestion) {
      question1 = postQuestion;
      question2 = otherQuestion;
    } else {
      question1 = otherQuestion;
      question2 = postQuestion;
    }

    const result = await createCoherenceLink(
      question1,
      question2,
      direction,
      strength,
      LinkTypes.Causal
    );

    if (result !== null) {
      const message = result?.non_field_errors?.at(0);
      const constraintName =
        message?.match(/Constraint “(.+)” is violated\./)?.[1] ?? null;
      setValidationErrors(getLinkCreationError(constraintName));
    } else {
      await cancelLink();
    }

    return result;
  }

  async function saveQuestionLinkAndUpdate() {
    const result = await saveQuestionLink();
    if (result === null) {
      await updateCoherenceLinks();
    }
  }

  useImperativeHandle(forwardedRef, () => ({
    async save() {
      const result = await saveQuestionLink();
      return result === null;
    },
  }));

  async function cancelLink() {
    await deleteLink(linkKey);
    setCancelled(true);
  }

  async function swapFormat() {
    setIsFirstQuestion(!isFirstQuestion);
  }

  async function otherQuestionSelected(question: Question) {
    setOtherQuestion(question);
    setIsPickerOpen(false);
  }

  async function clearOtherQuestion() {
    setOtherQuestion(null);
    setIsPickerOpen(false);
    setPickerInitialSearch(""); // Clear the search state
  }

  function openPickerWithQuestion() {
    setPickerInitialSearch(otherQuestion?.id?.toString() || "");
    setIsPickerOpen(true);
  }

  const typeOfSecondQuestion =
    (isFirstQuestion ? otherQuestion?.type : post.question?.type) ??
    QuestionType.Binary;
  const isAdverbialPhrasing = typeOfSecondQuestion !== QuestionType.Binary;

  if (cancelled) return null;

  return (
    <div className={"rounded-md bg-gray-100 p-4 dark:bg-gray-100-dark"}>
      <div>
        {t.rich(
          isFirstQuestion
            ? isAdverbialPhrasing
              ? "thisQuestionCausesOtherQuestionAdverbial"
              : "thisQuestionCausesOtherQuestion"
            : isAdverbialPhrasing
              ? "otherQuestionCausesThisQuestionAdverbial"
              : "otherQuestionCausesThisQuestion",
          {
            direction: () => (
              <DirectionSelect
                value={direction}
                onChange={(value) => setDirection(value)}
                typeOfSecondQuestion={typeOfSecondQuestion}
                t={t}
              />
            ),
            type: () => (
              <span>{t(isAdverbialPhrasing ? "causally" : "causal")}</span>
            ),
            otherQuestion: () => (
              <span>
                {!otherQuestion ? (
                  <Button
                    onClick={() => {
                      setPickerInitialSearch(""); // Ensure empty state
                      setIsPickerOpen(true);
                    }}
                    variant="secondary"
                    size="sm"
                    className="my-1 px-2 py-1.5"
                  >
                    {t("pickQuestion")}
                  </Button>
                ) : (
                  <div
                    className="my-2 inline-flex min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-blue-200 pl-2.5 transition-colors hover:bg-blue-300 dark:border-gray-300-dark dark:bg-blue-200-dark dark:hover:bg-blue-300-dark sm:max-w-md"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openPickerWithQuestion();
                    }}
                  >
                    <span
                      className={`text-sm font-medium leading-tight text-gray-900 dark:text-gray-900-dark ${!isFirstQuestion ? "max-w-[220px] truncate py-0" : "py-1.5"}`}
                    >
                      {otherQuestion.title}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        void clearOtherQuestion();
                      }}
                      className="flex-shrink-0 rounded-sm p-1 transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={faXmark}
                        className="size-4 text-salmon-600 hover:text-salmon-800 dark:text-salmon-600-dark dark:hover:text-salmon-800-dark"
                      />
                    </button>
                  </div>
                )}
              </span>
            ),
          }
        )}
      </div>
      <div>
        <LinkStrengthSelectorComponent
          onSelect={(value) => setStrength(value)}
        />{" "}
      </div>

      {/* Controlled QuestionPicker modal */}
      <QuestionPicker
        searchedQuestionType={SearchedQuestionType.Coherence}
        onQuestionChange={otherQuestionSelected}
        isOpen={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        initialSearch={pickerInitialSearch}
        divClassName="hidden" // Hide the button since we control it externally
      />

      <div className={"mt-2 flex justify-between"}>
        <div className="flex flex-row gap-2">
          <Button onClick={swapFormat} variant="tertiary">
            {t("swap")}
          </Button>
          {shouldDisplaySave !== false && (
            <Button
              onClick={saveQuestionLinkAndUpdate}
              disabled={!otherQuestion}
              variant="tertiary"
            >
              {t("save")}
            </Button>
          )}
        </div>
        {shouldDisplayDelete !== false && (
          <Button
            onClick={cancelLink}
            className="size-8 border border-salmon-500 hover:border-salmon-600 dark:border-salmon-500-dark dark:hover:border-salmon-600-dark"
            variant="tertiary"
          >
            <FontAwesomeIcon
              icon={faTrash}
              className="text-salmon-600 dark:text-salmon-600-dark"
            />
          </Button>
        )}
      </div>
      {validationErrors && (
        <FormErrorMessage
          className={"text-base"}
          errors={t(validationErrors)}
        />
      )}
    </div>
  );
};

export default forwardRef(CreateCoherenceLink);
