import { Select } from "@headlessui/react";
import Link from "next/link";
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
import { getPostLink } from "@/utils/navigation";

type Props = {
  post: Post;
  linkCreated: () => Promise<void>;
};

const directionOptions = [Directions.Positive, Directions.Negative];
const strengthOptions = [Strengths.Low, Strengths.Medium, Strengths.High];

export const CreateCoherenceLink: FC<Props> = ({ post, linkCreated }) => {
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);
  const [direction, setDirection] = useState(Directions.Positive);
  const [strength, setStrength] = useState(Strengths.Medium);
  const [otherQuestion, setOtherQuestion] =
    useState<QuestionWithForecasts | null>(null);
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
  }

  if (cancelled) return null;

  return (
    <div className={"m-2 bg-gray-100-dark p-4"}>
      <div>
        {t.rich(
          isFirstQuestion
            ? "thisQuestionCausesOtherQuestion"
            : "otherQuestionCausesThisQuestion",
          {
            strength: () => (
              <Select
                value={strength}
                onChange={(event) => {
                  setStrength(event.target.value as Strengths);
                }}
                className="select-arrow ml-1 mr-1 h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-2 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
              >
                {strengthOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className={"bg-gray-0 dark:bg-gray-0-dark"}
                  >
                    {t(option)}
                  </option>
                ))}
              </Select>
            ),
            direction: () => (
              <Select
                value={direction}
                onChange={(event) => {
                  setDirection(event.target.value as Directions);
                }}
                className="select-arrow ml-1 mr-1 h-8 rounded border border-gray-700 bg-inherit bg-[length:22px_20%] bg-no-repeat px-2 text-gray-900 dark:border-gray-700-dark dark:text-gray-900-dark"
              >
                {directionOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className={"bg-gray-0 dark:bg-gray-0-dark"}
                  >
                    {t(option)}
                  </option>
                ))}
              </Select>
            ),
            linkType: () => <span>{t("causal")}</span>,
            otherQuestion: () => (
              <span>
                <QuestionPicker
                  searchedQuestionType={SearchedQuestionType.Coherence}
                  onQuestionChange={otherQuestionSelected}
                  divClassName={"inline-block"}
                ></QuestionPicker>{" "}
                {otherQuestion && (
                  <Link href={getPostLink(otherQuestion)} target="_blank">
                    <b>{otherQuestion.title}</b>
                  </Link>
                )}
              </span>
            ),
          }
        )}
      </div>
      <div className={"mt-3"}>
        <Button onClick={swapFormat} className={"mr-2"}>
          {t("swap")}
        </Button>
        <Button onClick={cancelLink} className={"mr-2"}>
          {t("cancel")}
        </Button>
        <Button onClick={saveQuestion} disabled={!otherQuestion}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
};
