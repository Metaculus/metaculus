import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { deleteCoherenceLink } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CoherenceLink, Directions, Strengths } from "@/types/coherence";
import { Post } from "@/types/post";
import { Question } from "@/types/question";
import { getPostLink } from "@/utils/navigation";

type Props = {
  link: CoherenceLink;
  post: Post;
  compact: boolean;
  linkModified: () => Promise<void>;
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

const StrengthComponent: FC<{ strength: Strengths }> = ({ strength }) => {
  const t = useTranslations();
  switch (strength) {
    case Strengths.High:
      return <span className={"font-bold"}>{t("high")}</span>;
    case Strengths.Medium:
      return <span className={"font-bold"}>{t("medium")}</span>;
    case Strengths.Low:
      return <span className={"font-bold"}>{t("low")}</span>;
  }
};

export const DisplayCoherenceLink: FC<Props> = ({
  link,
  post,
  compact,
  linkModified,
}) => {
  const isFirstQuestion = link.question1_id === post.question?.id;
  const otherQuestionID = isFirstQuestion
    ? link.question2_id
    : link.question1_id;
  const [otherQuestion, setOtherQuestion] = useState<Question | null>(null);
  const [canceled, setCanceled] = useState<boolean>(false);
  const t = useTranslations();

  useEffect(() => {
    ClientPostsApi.getQuestion(otherQuestionID).then((question) =>
      setOtherQuestion(question)
    );
  }, [otherQuestionID]);

  async function deleteLink() {
    setCanceled(true);
    await deleteCoherenceLink(link);
    await linkModified();
  }

  if (!otherQuestion || canceled) return null;

  if (compact)
    return (
      <div>
        <Link href={getPostLink(otherQuestion)} target="_blank">
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

  return (
    <div className={"rounded-md bg-gray-100 p-4 dark:bg-gray-100-dark"}>
      <div>
        {t.rich(
          isFirstQuestion
            ? "thisQuestionCausesOtherQuestion"
            : "otherQuestionCausesThisQuestion",
          {
            impact: () => (
              <>
                <StrengthComponent strength={link.strength} />{" "}
                <DirectionComponent direction={link.direction} />{" "}
                <span>{t("causal")}</span>
              </>
            ),
            otherQuestion: () => (
              <Link
                href={getPostLink(otherQuestion)}
                target="_blank"
                className="font-normal text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
              >
                {otherQuestion.title}
              </Link>
            ),
          }
        )}
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
