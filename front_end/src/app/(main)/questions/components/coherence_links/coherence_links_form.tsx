import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { CommentForm } from "@/app/(main)/questions/[id]/components/comment_form";
import CreateCoherenceLink, {
  CreateCoherenceLinkRefType,
} from "@/app/(main)/questions/components/coherence_links/create_coherence_link";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CommentType } from "@/types/comment";
import { Post } from "@/types/post";
import { Question, QuestionType } from "@/types/question";
import { ApiError } from "@/utils/core/errors";

type Props = {
  post: Post;
  comment: CommentType;
};

export const CoherenceLinksForm: FC<Props> = ({ post, comment }) => {
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [displayed, setDisplayed] = useState<boolean>(true);
  const { updateCoherenceLinks } = useCoherenceLinksContext();
  const childRefs = useRef<Map<number, CreateCoherenceLinkRefType | null>>(
    new Map()
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [nrQuestionsInitial, setNrQuestionsInitial] = useState<number>(0);
  const text = comment.text;
  const currentQuestionId = post.question?.post_id;
  const t = useTranslations();

  function extractQuestionNumbers(text: string): number[] {
    const regex = /(?:\/questions\/|<EmbeddedQuestion id=")(\d+)/g;
    const array = Array.from(text.matchAll(regex), (match) => {
      return parseInt(match[1] ?? "-1");
    });
    return [...new Set(array.filter((it) => it !== -1))];
  }

  async function deleteLink(key: number) {
    setQuestions(questions.filter((current) => current.post_id !== key));
  }

  async function extractPostIDs(newPostIDs: number[]): Promise<Question[]> {
    const newQuestions: Question[] = [];
    const values = await Promise.allSettled(
      Array.from(newPostIDs, (id) => ClientPostsApi.getPost(id))
    );
    for (const value of values) {
      if (value.status === "fulfilled") {
        const newPost = value.value;
        const newQuestion = newPost.question;
        if (newQuestion?.type === QuestionType.Binary)
          newQuestions.push(newQuestion);
      } else {
        const e = value.reason;
        const error = ApiError.isApiError(e) ? e.data : undefined;
        if (error) {
          console.log("API Error retrieving post.", error);
        } else {
          console.log(e);
        }
      }
    }
    return newQuestions;
  }

  useEffect(() => {
    const newPostIDs = extractQuestionNumbers(text);
    extractPostIDs(newPostIDs).then((result) => {
      setNrQuestionsInitial(result.length);
      setQuestions(result);
    });
  }, [text]);

  async function submitAll() {
    let failed = false;
    for (const ref of childRefs.current.values()) {
      const saveStatus = await ref?.save();
      if (saveStatus === false) failed = true;
    }
    await updateCoherenceLinks();
    if (!failed) setFormSubmitted(true);
  }

  if (!currentQuestionId || questions.length === 0 || !displayed) return null;

  return (
    <CommentForm
      onCancel={() => setDisplayed(false)}
      onSubmit={submitAll}
      buttonsDisplayed={!formSubmitted}
    >
      {formSubmitted && (
        <div className={"flex flex-auto justify-between"}>
          <div className={"text-xl"}>
            {nrQuestionsInitial === 1
              ? t("questionLinkCreated")
              : t("questionLinkCreatedMultiple")}
          </div>
          <FontAwesomeIcon icon={faXmark} onClick={() => setDisplayed(false)} />
        </div>
      )}
      {!formSubmitted && (
        <>
          <div className={"text-2xl"}>
            {nrQuestionsInitial === 1
              ? t("createQuestionLinkCommentPrompt")
              : t("createQuestionLinkCommentPromptMultiple")}
          </div>
          <div>
            {nrQuestionsInitial === 1
              ? t("createQuestionLinkCommentPromptBody")
              : t("createQuestionLinkCommentPromptBodyMultiple")}
          </div>
          <div>{t("createQuestionLinkCommentPromptDisclaimer")}</div>
          {Array.from(questions, (question) => (
            <CreateCoherenceLink
              post={post}
              linkKey={question.post_id}
              key={question.post_id}
              deleteLink={deleteLink}
              suggestedOtherQuestion={question}
              shouldDisplayDelete={questions.length !== 1}
              shouldDisplaySave={false}
              ref={(el) => {
                childRefs.current.set(question.post_id, el);
              }}
            />
          ))}
        </>
      )}
    </CommentForm>
  );
};
