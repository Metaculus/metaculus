import Link from "next/link";
import { FC, useState } from "react";

import { createCoherenceLink } from "@/app/(main)/questions/actions";
import QuestionPicker from "@/app/(main)/questions/components/question_picker";
import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { Directions, Strengths } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question, QuestionWithForecasts } from "@/types/question";

type Props = {
  post: Post;
  linkCreated: () => Promise<void>;
};

const directionOptions = ["positive", "negative"];
const strengthOptions = ["low", "medium", "high"];

export const CreateCoherenceLink: FC<Props> = ({ post, linkCreated }) => {
  const [cancelled, setCancelled] = useState<boolean>(false);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);
  const [direction, setDirection] = useState<Directions>("positive");
  const [strength, setStrength] = useState<Strengths>("medium");
  const [otherQuestion, setOtherQuestion] =
    useState<QuestionWithForecasts | null>(null);

  const directionMenuItems = directionOptions.map((it) => ({
    id: it,
    name: it,
    onClick: () => setDirection(it as Directions),
  }));
  const strengthMenuItems = strengthOptions.map((it) => ({
    id: it,
    name: it,
    onClick: () => setStrength(it as Strengths),
  }));

  async function saveQuestion() {
    let question1: Question | null;
    let question2: Question | null;

    if (isFirstQuestion) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      question1 = post.question!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      question2 = otherQuestion!;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      question1 = otherQuestion!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      question2 = post.question!;
    }

    await createCoherenceLink(
      question1,
      question2,
      direction,
      strength,
      "causal"
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

  function getQuestionHyperlink(
    question: Question | null
  ): string {
    if (!question) return "";
    return `/questions/${question.post_id}`;
  }

  if (cancelled) return null;

  return (
    <>
      <div className={"bg-gray-100-dark p-4"}>
        <div>
          {isFirstQuestion ? (
            <div>
              This question has a{" "}
              <DropdownMenu
                items={directionMenuItems}
                itemClassName={"inline-block"}
                innerDivClassName={"inline-block"}
              >
                <Button>{direction}</Button>
              </DropdownMenu>{" "}
              <DropdownMenu
                items={strengthMenuItems}
                itemClassName={"inline-block"}
                innerDivClassName={"inline-block"}
              >
                <Button>{strength}</Button>
              </DropdownMenu>{" "}
              causal impact on{" "}
              <QuestionPicker
                searchedQuestionType={"default"}
                onQuestionChange={otherQuestionSelected}
                divClassName={"inline-block"}
                buttonClassName={"inline-block"}
              ></QuestionPicker>{" "}
              <Link href={getQuestionHyperlink(otherQuestion)} target="_blank">
                <b>{otherQuestion?.title}</b>
              </Link>
              .
            </div>
          ) : (
            <div>
              <QuestionPicker
                searchedQuestionType={"default"}
                onQuestionChange={otherQuestionSelected}
                divClassName={"inline-block"}
                buttonClassName={"inline-block"}
              ></QuestionPicker>{" "}
              <Link href={getQuestionHyperlink(otherQuestion)} target="_blank">
                <b>{otherQuestion?.title}</b>
              </Link>{" "}
              has a{" "}
              <DropdownMenu
                items={directionMenuItems}
                itemClassName={"inline-block"}
                innerDivClassName={"inline-block"}
              >
                <Button>{direction}</Button>
              </DropdownMenu>{" "}
              <DropdownMenu
                items={strengthMenuItems}
                itemClassName={"inline-block"}
                innerDivClassName={"inline-block"}
              >
                <Button>{strength}</Button>
              </DropdownMenu>{" "}
              causal impact on this question.
            </div>
          )}
        </div>
        <br />
        <Button onClick={swapFormat}>Swap</Button>
        <Button onClick={cancelLink}>Cancel</Button>
        <Button onClick={saveQuestion} disabled={!otherQuestion}>
          Save
        </Button>
      </div>
      <br />
    </>
  );
};
