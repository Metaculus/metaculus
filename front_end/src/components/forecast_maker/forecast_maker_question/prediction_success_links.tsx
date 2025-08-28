"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { DisplayCoherenceLink } from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import { CoherenceLink } from "@/types/coherence";
import { PostWithForecasts, QuestionStatus } from "@/types/post";

interface Props {
  post: PostWithForecasts;
}

export const PredictionSuccessLinks: FC<Props> = ({ post }) => {
  const { coherenceLinks, getOtherQuestions } = useCoherenceLinksContext();
  const t = useTranslations();
  const [coherenceLinksData, setCoherenceLinksData] = useState<CoherenceLink[]>(
    []
  );

  const questionID = post?.question?.id;

  useEffect(() => {
    const otherQuestions = getOtherQuestions();
    setCoherenceLinksData(
      coherenceLinks.data.filter(
        (it) => otherQuestions.get(it.id)?.status == QuestionStatus.OPEN
      )
    );
  }, [coherenceLinks, getOtherQuestions, questionID]);

  if (coherenceLinksData.length === 0) return null;

  return (
    <div>
      {t("updateLinksRequest")}
      {Array.from(coherenceLinksData, (link) => (
        <DisplayCoherenceLink
          key={link.id}
          link={link}
          post={post}
          compact={true}
        ></DisplayCoherenceLink>
      ))}
    </div>
  );
};
