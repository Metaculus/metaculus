import { faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { createCoherenceLink } from "@/app/(main)/questions/actions";
import QuestionPicker, {
  SearchedQuestionType,
} from "@/app/(main)/questions/components/question_picker";
import Button from "@/components/ui/button";
import { Directions, LinkTypes, Strengths } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question, QuestionWithForecasts } from "@/types/question";

type Props = {
  post: Post;
  linkCreated: () => Promise<void>;
};

const directionOptions = [Directions.Positive, Directions.Negative];
const strengthOptions = [Strengths.Low, Strengths.Medium, Strengths.High];

// Reusable styled select component
const StyledSelect: FC<{
  value: Strengths | Directions;
  onChange: (value: string) => void;
  options: (Strengths | Directions)[];
  t: ReturnType<typeof useTranslations>;
}> = ({ value, onChange, options, t }) => (
  <Select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="select-arrow h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-3 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
  >
    {options.map((option) => (
      <option
        key={option}
        value={option}
        className={"bg-gray-0 dark:bg-gray-0-dark"}
      >
        {t(option)}
      </option>
    ))}
  </Select>
);

export const CreateCoherenceLink: FC<Props> = ({ post, linkCreated }) => {
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);
  const [direction, setDirection] = useState(Directions.Positive);
  const [strength, setStrength] = useState(Strengths.Medium);
  const [otherQuestion, setOtherQuestion] =
    useState<QuestionWithForecasts | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerInitialSearch, setPickerInitialSearch] = useState<string>("");
  const t = useTranslations();

  async function saveQuestion() {
    let question1: Question | null;
    let question2: Question | null;
    const postQuestion = post.question;

    if (!postQuestion || !otherQuestion) return;

    if (isFirstQuestion) {
      question1 = postQuestion;
      question2 = otherQuestion;
    } else {
      question1 = otherQuestion;
      question2 = postQuestion;
    }

    await createCoherenceLink(
      question1,
      question2,
      direction,
      strength,
      LinkTypes.Causal
    );
    await cancelLink();
    await linkCreated();
  }

  async function cancelLink() {
    setCancelled(true);
  }

  async function swapFormat() {
    setIsFirstQuestion(!isFirstQuestion);
  }

  async function otherQuestionSelected(question: QuestionWithForecasts) {
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

  if (cancelled) return null;

  return (
    <div className={"rounded-md bg-gray-100 p-4 dark:bg-gray-100-dark"}>
      <div>
        {t.rich(
          isFirstQuestion
            ? "thisQuestionCausesOtherQuestion"
            : "otherQuestionCausesThisQuestion",
          {
            strength: () => (
              <StyledSelect
                value={strength}
                onChange={(value) => setStrength(value as Strengths)}
                options={strengthOptions}
                t={t}
              />
            ),
            direction: () => (
              <StyledSelect
                value={direction}
                onChange={(value) => setDirection(value as Directions)}
                options={directionOptions}
                t={t}
              />
            ),
            linkType: () => <span>{t("causal")}</span>,
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
                    <span className="max-w-[220px] truncate text-sm font-medium text-gray-900 dark:text-gray-900-dark">
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
          <Button
            onClick={saveQuestion}
            disabled={!otherQuestion}
            variant="tertiary"
          >
            {t("save")}
          </Button>
        </div>
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
      </div>
    </div>
  );
};
