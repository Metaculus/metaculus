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
import { CoherenceLink, Directions } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question, QuestionType } from "@/types/question";
import { getPostLink } from "@/utils/navigation";

type Props = {
  link: CoherenceLink;
  post: Post;
  compact: boolean;
};

const DirectionComponent: FC<{ direction: Directions }> = ({ direction }) => {
  const t = useTranslations();
  switch (direction) {
    case Directions.Positive:
      return (
        <span className={"font-bold text-olive-700 dark:text-olive-700-dark"}>
          {t("positive")}
        </span>
      );
    case Directions.Negative:
      return (
        <span className={"font-bold text-salmon-600 dark:text-salmon-600-dark"}>
          {t("negative")}
        </span>
      );
  }
};

export const DisplayCoherenceLink: FC<Props> = ({ link, post, compact }) => {
  const isFirstQuestion = link.question1_id === post.question?.id;
  const [otherQuestion, setOtherQuestion] = useState<Question | null>(null);
  const [canceled, setCanceled] = useState<boolean>(false);
  const { updateCoherenceLinks } = useCoherenceLinksContext();
  const t = useTranslations();

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
    setCanceled(true);
    await deleteCoherenceLink(link);
    await updateCoherenceLinks();
  }

  if (!otherQuestion || canceled) return null;

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

  const isAdverbialPhrasing =
    (isFirstQuestion ? otherQuestion?.type : post.question?.type) !==
    QuestionType.Binary;

  return (
    <div className={"rounded-md bg-gray-100 p-4 dark:bg-gray-100-dark"}>
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
            direction: () => <DirectionComponent direction={link.direction} />,
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
      <div>
        <LinkStrengthComponent strength={link.strength} disabled={true} />
      </div>
      <Button
        onClick={deleteLink}
        className="mt-3 border border-salmon-500 text-salmon-600 hover:border-salmon-600 dark:border-salmon-500-dark dark:text-salmon-600-dark dark:hover:border-salmon-600-dark"
        variant="tertiary"
      >
        <FontAwesomeIcon icon={faTrash} />
        Delete
      </Button>
    </div>
  );
};
