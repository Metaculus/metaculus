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
};

const DirectionComponent: FC<{ direction: Directions }> = ({ direction }) => {
  const t = useTranslations();
  switch (direction) {
    case Directions.Positive:
      return <span className={"text-green-400"}>{t("positive")}</span>;
    case Directions.Negative:
      return <span className={"text-red-400"}>{t("negative")}</span>;
  }
};

const StrengthComponent: FC<{ strength: Strengths }> = ({ strength }) => {
  const t = useTranslations();
  switch (strength) {
    case Strengths.High:
      return <span className={"font-black"}>{t("high")}</span>;
    case Strengths.Medium:
      return <span className={"font-medium"}>{t("medium")}</span>;
    case Strengths.Low:
      return <span className={"font-thin"}>{t("low")}</span>;
  }
};

export const DisplayCoherenceLink: FC<Props> = ({ link, post, compact }) => {
  const isFirstQuestion = link.question1 === post.question?.id;
  const otherQuestionID = isFirstQuestion ? link.question2 : link.question1;
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
          className={"ml-1 border-none !bg-inherit p-1 text-sm underline"}
        >
          ({t("unlink")})
        </Button>
      </div>
    );

  return (
    <div className={"m-2"}>
      <div className={"bg-gray-100-dark p-4"}>
        <div>
          {t.rich(
            isFirstQuestion
              ? "thisQuestionCausesOtherQuestion"
              : "otherQuestionCausesThisQuestion",
            {
              strength: () => <StrengthComponent strength={link.strength} />,
              direction: () => (
                <DirectionComponent direction={link.direction} />
              ),
              linkType: () => <span>{t("causal")}</span>,
              otherQuestion: () => (
                <Link href={getPostLink(otherQuestion)} target="_blank">
                  <b>{otherQuestion.title}</b>
                </Link>
              ),
            }
          )}
        </div>
        <Button onClick={deleteLink} className={"mt-3"}>
          {t("delete")}
        </Button>
      </div>
    </div>
  );
};
