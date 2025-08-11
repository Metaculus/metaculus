import { FC, useEffect, useState } from "react";

import { CreateCoherenceLink } from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CommentType } from "@/types/comment";
import { Post } from "@/types/post";
import { Question } from "@/types/question";

type Props = {
  post: Post;
  comment: CommentType;
};

export const CoherenceLinksForm: FC<Props> = ({ post, comment }) => {
  const [questionIDs, setQuestionIDs] = useState<number[]>([]);

  function extractQuestionNumbers(text: string): Promise<number[]> {
    const regex = /\/questions\/(\d+)/g;
    const array = Array.from(text.matchAll(regex), (match) =>
      parseInt(match[1])
    );
    return [...new Set(array)];
  }

  async function deleteLink(key: number) {
    setQuestionIDs(questionIDs.filter((current) => current !== key));
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const text = comment.text;
  const currentQuestionId = post.question?.post_id;

  useEffect(() => {
    async function extractQuestions(
      newQuestionIDs: number[]
    ): Promise<Question[]> {
      const newQuestions = [];
      for (const id of newQuestionIDs) {
        const newQuestion = await ClientPostsApi.getQuestion(id);
        newQuestions.push(newQuestion);
      }
      return newQuestions;
    }

    const newQuestionIDs = extractQuestionNumbers(text);
    setQuestionIDs(newQuestionIDs);
    extractQuestions(newQuestionIDs).then((result) => {
      setQuestions(result);
    });
  }, [text]);

  if (!currentQuestionId || questions.length === 0) return null;

  return (
    <div>
      Here are some question links for you!
      {Array.from(questions, (question) => (
        <CreateCoherenceLink
          post={post}
          linkKey={post.id}
          key={post.id}
          deleteLink={deleteLink}
          linkCreated={deleteLink}
          suggestedOtherQuestion={question}
        />
      ))}
    </div>
  );
};
