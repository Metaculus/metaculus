import Link from "next/link";
import { FC } from "react";

import Button from "@/components/ui/button";
import { CoherenceLink } from "@/types/coherence";
import { Post } from "@/types/post";

type Props = {
  link: CoherenceLink;
  post: Post;
};
export const DisplayCoherenceLink: FC<Props> = ({ link, post }) => {
  const isFirstQuestion = link.question1 === post.question?.id;
  const otherQuestionID = isFirstQuestion ? link.question2 : link.question1;
  return (
    <>
      <div>
        {isFirstQuestion ? (
          <div>
            This question has a {link.strength} {link.direction} {link.type}{" "}
            impact on{" "}
            <Link href={`/questions/${otherQuestionID}`} target="_blank">
              <b>{otherQuestionID}</b>
            </Link>
            .
          </div>
        ) : (
          <div>
            The question{" "}
            <Link href={`/questions/${otherQuestionID}`} target="_blank">
              <b>{otherQuestionID}</b>
            </Link>{" "}
            has a {link.strength} {link.direction} {link.type} impact on this
            question.
          </div>
        )}
        <Button>Delete</Button>
      </div>
      <br />
    </>
  );
};
