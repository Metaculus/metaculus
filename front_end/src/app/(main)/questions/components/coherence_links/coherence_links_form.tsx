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
  const [postIDs, setPostIDs] = useState<number[]>([]);

  function extractQuestionNumbers(text: string): number[] {
    const regex = /\/questions\/(\d+)/g;
    const array = Array.from(text.matchAll(regex), (match) =>
      parseInt(match[1] ?? "-1")
    );
    return [...new Set(array.filter((it) => it !== -1))];
  }

  async function deleteLink(key: number) {
    setPostIDs(postIDs.filter((current) => current !== key));
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const text = comment.text;
  const currentQuestionId = post.question?.post_id;

  useEffect(() => {
    async function extractPostIDs(newPostIDs: number[]): Promise<Question[]> {
      const newQuestions = [];
      for (const id of newPostIDs) {
        const newPost = await ClientPostsApi.getPost(id);
        const newQuestion = newPost.question;
        if (newQuestion) newQuestions.push(newQuestion);
      }
      return newQuestions;
    }

    const newPostIDs = extractQuestionNumbers(text);
    setPostIDs(newPostIDs);
    extractPostIDs(newPostIDs).then((result) => {
      setQuestions(result);
    });
  }, [text]);

  if (!currentQuestionId || postIDs.length === 0) return null;

  return (
    <div>
      Here are some question links for you!
      {Array.from(questions, (question) => (
        <CreateCoherenceLink
          post={post}
          linkKey={question.post_id}
          key={question.post_id}
          deleteLink={deleteLink}
          suggestedOtherQuestion={question}
        />
      ))}
    </div>
  );
};
