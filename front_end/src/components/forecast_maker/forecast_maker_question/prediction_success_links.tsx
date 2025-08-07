"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { DisplayCoherenceLink } from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CoherenceLink } from "@/types/coherence";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { Question } from "@/types/question";

interface Props {
  post: PostWithForecasts;
}

export const PredictionSuccessLinks: FC<Props> = ({ post }) => {
  const { coherenceLinks, updateCoherenceLinks } = useCoherenceLinksContext();
  const t = useTranslations();
  const [coherenceLinksData, setCoherenceLinksData] = useState<CoherenceLink[]>(
    []
  );

  const questionID = post?.question?.id;

  useEffect(() => {
    const getOtherQuestions = async () => {
      const questionData = new Map<number, Question>();
      for (const link of coherenceLinks.data) {
        const otherQuestionId =
          questionID == link.question1_id
            ? link.question2_id
            : link.question1_id;
        const otherQuestion = await ClientPostsApi.getQuestion(otherQuestionId);
        questionData.set(link.id, otherQuestion);
      }
      return questionData;
    };

    const retrieveCoherenceLinks = async () => {
      const otherQuestions = await getOtherQuestions();
      setCoherenceLinksData(
        coherenceLinks.data.filter(
          (it) => otherQuestions.get(it.id)?.status == QuestionStatus.OPEN
        )
      );
    };

    void retrieveCoherenceLinks();
  }, [coherenceLinks, questionID]);

  if (coherenceLinksData.length === 0) return null;

  return (
    <div>
      {t("updateLinksRequest")}
      {Array.from(coherenceLinksData, (link) => (
        <DisplayCoherenceLink
          key={link.id}
          link={link}
          post={post}
          linkModified={updateCoherenceLinks}
          compact={true}
        ></DisplayCoherenceLink>
      ))}
    </div>
  );
};
