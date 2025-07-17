import Link from "next/link";
import { FC, useState } from "react";

import { createCoherenceLink } from "@/app/(main)/questions/actions";
import QuestionPicker, {
  SearchedQuestionType,
} from "@/app/(main)/questions/components/question_picker";
import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
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
              searchedQuestionType={SearchedQuestionType.Coherence}
              onQuestionChange={otherQuestionSelected}
              divClassName={"inline-block"}
            ></QuestionPicker>{" "}
            {otherQuestion && (
              <Link href={getPostLink(otherQuestion)} target="_blank">
                <b>{otherQuestion.title}</b>
              </Link>
            )}
            .
          </div>
        ) : (
          <div>
            <QuestionPicker
              searchedQuestionType={SearchedQuestionType.Coherence}
              onQuestionChange={otherQuestionSelected}
              divClassName={"inline-block"}
            ></QuestionPicker>{" "}
            {otherQuestion && (
              <Link href={getPostLink(otherQuestion)} target="_blank">
                <b>{otherQuestion.title}</b>
              </Link>
            )}{" "}
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
      <div className={"mt-3"}>
        <Button onClick={swapFormat} className={"mr-2"}>
          Swap
        </Button>
        <Button onClick={cancelLink} className={"mr-2"}>
          Cancel
        </Button>
        <Button onClick={saveQuestion} disabled={!otherQuestion}>
          Save
        </Button>
      </div>
    </div>
  );
};
