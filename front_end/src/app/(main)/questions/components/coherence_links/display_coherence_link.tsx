import Link from "next/link";
import { FC, useEffect, useState } from "react";

import { deleteCoherenceLink } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CoherenceLink, Directions, Strengths } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question } from "@/types/question";

type Props = {
  link: CoherenceLink;
  post: Post;
};

const DirectionComponent: FC<{ direction: Directions }> = ({ direction }) => {
  switch (direction) {
    case "positive":
      return <span className={"text-green-400"}>positive</span>;
    case "negative":
      return <span className={"text-red-400"}>negative</span>;
  }
};

const StrengthComponent: FC<{ strength: Strengths }> = ({ strength }) => {
  switch (strength) {
    case "high":
      return <span className={"font-black"}>high</span>;
    case "medium":
      return <span className={"font-medium"}>medium</span>;
    case "low":
      return <span className={"font-thin"}>low</span>;
  }
};

export const DisplayCoherenceLink: FC<Props> = ({ link, post }) => {
  const isFirstQuestion = link.question1 === post.question?.id;
  const otherQuestionID = isFirstQuestion ? link.question2 : link.question1;
  const [otherQuestion, setOtherQuestion] = useState<Question | null>(null);
  const [canceled, setCanceled] = useState<boolean>(false);

  useEffect(() => {
    ClientPostsApi.getQuestion(otherQuestionID).then((question) =>
      setOtherQuestion(question)
    );
  }, [otherQuestionID]);

  function getQuestionHyperlink(question: Question | null): string {
    if (!question) return "";
    return `/questions/${question.post_id}`;
  }

  async function deleteLink() {
    setCanceled(true);
    await deleteCoherenceLink(link);
  }

  if (!otherQuestion || canceled) return null;

  return (
    <>
      <div className={"bg-gray-100-dark p-4"}>
        {isFirstQuestion ? (
          <div>
            This question has a <StrengthComponent strength={link.strength} />{" "}
            <DirectionComponent direction={link.direction} /> {link.type} impact
            on{" "}
            <Link href={getQuestionHyperlink(otherQuestion)} target="_blank">
              <b>{otherQuestion.title}</b>
            </Link>
            .
          </div>
        ) : (
          <div>
            The question{" "}
            <Link href={getQuestionHyperlink(otherQuestion)} target="_blank">
              <b>{otherQuestion.title}</b>
            </Link>{" "}
            has a <StrengthComponent strength={link.strength} />{" "}
            <DirectionComponent direction={link.direction} /> {link.type} impact
            question.
          </div>
        )}
        <br />
        <Button onClick={deleteLink}>Delete</Button>
      </div>
      <br />
    </>
  );
};
