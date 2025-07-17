"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { DisplayCoherenceLink } from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import ClientCoherenceLinksApi from "@/services/api/coherence_links/coherence_links.client";
import { CoherenceLinksGroup } from "@/types/coherence";
import { PostWithForecasts } from "@/types/post";

interface Props {
  post: PostWithForecasts;
}

export const PredictionSuccessLinks: FC<Props> = ({ post }) => {
  const [coherenceLinks, setCoherenceLinks] =
    useState<CoherenceLinksGroup | null>(null);
  const t = useTranslations();

  useEffect(() => {
    ClientCoherenceLinksApi.getCoherenceLinksForPost(post)
      .then((links) => setCoherenceLinks(links))
      .catch((error) => console.log(error));
  }, [post]);

  if (!coherenceLinks || coherenceLinks.size === 0) return null;

  return (
    <div>
      {t("updateLinksRequest")}
      {Array.from(coherenceLinks?.data ?? [], (link, index) => (
        <DisplayCoherenceLink
          key={index}
          link={link}
          post={post}
          compact={true}
        ></DisplayCoherenceLink>
      ))}
    </div>
  );
};
