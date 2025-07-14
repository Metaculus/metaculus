import Link from "next/link";
import { FC, useEffect, useState } from "react";

import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CoherenceLink } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question } from "@/types/question";

type Props = {
  link: CoherenceLink;
  post: Post;
};
export const DisplayCoherenceLink: FC<Props> = ({ link, post }) => {
  const isFirstQuestion = link.question1 === post.question?.id;
  const otherQuestionID = isFirstQuestion ? link.question2 : link.question1;
  const [otherQuestion, setOtherQuestion] = useState<Question | null>(null);

  useEffect(() => {
    ClientPostsApi.getQuestion(otherQuestionID).then((question) =>
      setOtherQuestion(question)
    );
  }, [otherQuestionID]);

  if (!otherQuestion) return null;

  return (
    <>
      <div>
        {isFirstQuestion ? (
          <div>
            This question has a {link.strength} {link.direction} {link.type}{" "}
            impact on{" "}
            <Link href={`/questions/${otherQuestionID}`} target="_blank">
              <b>{otherQuestion.title}</b>
            </Link>
            .
          </div>
        ) : (
          <div>
            The question{" "}
            <Link href={`/questions/${otherQuestionID}`} target="_blank">
              <b>{otherQuestion.title}</b>
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
