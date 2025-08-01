"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { DisplayCoherenceLink } from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import { PostWithForecasts } from "@/types/post";

interface Props {
  post: PostWithForecasts;
}

export const PredictionSuccessLinks: FC<Props> = ({ post }) => {
  const { coherenceLinks, updateCoherenceLinks } = useCoherenceLinksContext();
  const t = useTranslations();

  if (!coherenceLinks || coherenceLinks.size === 0) return null;

  return (
    <div>
      {t("updateLinksRequest")}
      {Array.from(coherenceLinks?.data ?? [], (link) => (
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
