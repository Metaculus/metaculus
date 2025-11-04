import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { deleteCoherenceLink } from "@/app/(main)/questions/actions";
import LinkStrengthComponent from "@/app/(main)/questions/components/coherence_links/link_strength_component";
import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import {
  CoherenceLink,
  Certainty,
  FetchedAggregateCoherenceLink,
} from "@/types/coherence";
import { Post } from "@/types/post";
import { Question, QuestionType } from "@/types/question";
import { getTermByDirectionAndQuestionType } from "@/utils/coherence";
import { getPostLink } from "@/utils/navigation";

type Props = {
  link: CoherenceLink;
  post: Post;
  compact: boolean;
};

const DirectionComponent: FC<{
  direction: number;
  typeOfSecondQuestion: QuestionType | null;
}> = ({ direction, typeOfSecondQuestion }) => {
  const t = useTranslations();
  if (!typeOfSecondQuestion) return null;
  switch (direction) {
    case +1:
      return (
        <span className={"font-bold text-olive-700 dark:text-olive-700-dark"}>
          {t(getTermByDirectionAndQuestionType(+1, typeOfSecondQuestion))}
        </span>
      );
    case -1:
      return (
        <span className={"font-bold text-salmon-600 dark:text-salmon-600-dark"}>
          {t(getTermByDirectionAndQuestionType(-1, typeOfSecondQuestion))}
        </span>
      );
  }
};

const DisplayCoherenceLink: FC<Props> = ({ link, post, compact }) => {
  const isFirstQuestion = link.question1_id === post.question?.id;
  const [otherQuestion, setOtherQuestion] = useState<Question | null>(null);
  const [canceled, setCanceled] = useState<boolean>(false);
  const { updateCoherenceLinks } = useCoherenceLinksContext();
  const t = useTranslations();
  const isAggregate = "rsem" in link;

  useEffect(() => {
    if (isFirstQuestion && link.question2) setOtherQuestion(link.question2);
    else if (link.question1) setOtherQuestion(link.question1);
    else {
      const otherQuestionID = isFirstQuestion
        ? link.question2_id
        : link.question1_id;
      ClientPostsApi.getQuestion(otherQuestionID).then((question) =>
        setOtherQuestion(question)
      );
    }
  }, [isFirstQuestion, link]);

  async function deleteLink() {
    if (isAggregate) return;
    setCanceled(true);
    await deleteCoherenceLink(link);
    await updateCoherenceLinks();
  }

  if (!otherQuestion || canceled) return null;

  function getCertainty(value: number | null): Certainty {
    if (value === null) return Certainty.None;
    const absValue = Math.abs(value);
    if (absValue < 0.1) {
      return Certainty.Strong;
    } else if (absValue < 0.2) {
      return Certainty.Medium;
    }
    return Certainty.Weak;
  }

  if (compact)
    return (
      <div>
        <Link href={getPostLink({ id: otherQuestion.post_id })} target="_blank">
          <b>{otherQuestion.title}</b>
        </Link>
        <Button
          onClick={deleteLink}
          className={"border-none !bg-inherit p-1 text-sm underline"}
        >
          ({t("unlink")})
        </Button>
      </div>
    );

  const typeOfSecondQuestion =
    (isFirstQuestion ? otherQuestion?.type : post.question?.type) ?? null;
  const isAdverbialPhrasing = typeOfSecondQuestion !== QuestionType.Binary;

  return (
    <div
      className={
        "flex flex-row gap-3 rounded-md bg-gray-100 p-4 dark:bg-gray-100-dark"
      }
    >
      <div className={"flex-grow "}>
        <div>
          {t.rich(
            isFirstQuestion
              ? isAdverbialPhrasing
                ? "thisQuestionCausesOtherQuestionAdverbial"
                : "thisQuestionCausesOtherQuestion"
              : isAdverbialPhrasing
                ? "otherQuestionCausesThisQuestionAdverbial"
                : "otherQuestionCausesThisQuestion",
            {
              direction: () => (
                <DirectionComponent
                  direction={link.direction}
                  typeOfSecondQuestion={typeOfSecondQuestion}
                />
              ),
              type: () => (
                <span>{t(isAdverbialPhrasing ? "causally" : "causal")}</span>
              ),
              otherQuestion: () => (
                <Link
                  href={getPostLink({ id: otherQuestion.post_id })}
                  target="_blank"
                  className="font-normal text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
                >
                  {otherQuestion.title}
                </Link>
              ),
            }
          )}
        </div>
      </div>
      <div className={"flex flex-col items-end gap-1"}>
        <LinkStrengthComponent strength={link.strength} disabled={true} />
        {!isAggregate && (
          <Button
            onClick={deleteLink}
            className="mt-1.5 border border-salmon-500 text-salmon-600 hover:border-salmon-600 dark:border-salmon-500-dark dark:text-salmon-600-dark dark:hover:border-salmon-600-dark"
            variant="tertiary"
          >
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </Button>
        )}
        {isAggregate && (
          <div className={"mt-1"}>
            {t("certainty") + " "}
            <b>
              {t(getCertainty((link as FetchedAggregateCoherenceLink).rsem))}
            </b>
          </div>
        )}
      </div>
    </div>
  );
};
export default DisplayCoherenceLink;
