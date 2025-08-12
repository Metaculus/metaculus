import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { CreateCoherenceLink } from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import Button from "@/components/ui/button";
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
  const [cancelled, setCancelled] = useState<boolean>(false);
  const t = useTranslations();

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

  if (!currentQuestionId || postIDs.length === 0 || cancelled) return null;

  return (
    <div className="flex w-full grow flex-col gap-4 rounded bg-gray-0 px-3 py-2 text-base dark:bg-gray-0-dark">
      <h1>{t("createQuestionLinkCommentPrompt")}</h1>
      <div>{t("createQuestionLinkCommentPromptBody")}</div>
      <div>{t("createQuestionLinkCommentPromptDisclaimer")}</div>
      {Array.from(questions, (question) => (
        <CreateCoherenceLink
          post={post}
          linkKey={question.post_id}
          key={question.post_id}
          deleteLink={deleteLink}
          suggestedOtherQuestion={question}
        />
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setCancelled(true)}
        className="ml-auto"
      >
        {t("close")}
      </Button>
    </div>
  );
};
