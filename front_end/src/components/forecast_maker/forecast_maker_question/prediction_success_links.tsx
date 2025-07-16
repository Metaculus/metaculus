"use client";

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

  async function updatePage() {
    if (!post.question) return;
    const coherenceLinks =
      await ClientCoherenceLinksApi.getCoherenceLinksForQuestion(post.question);
    if ("errors" in coherenceLinks) setCoherenceLinks(null);
    else setCoherenceLinks(coherenceLinks);
  }

  useEffect(() => {
    void updatePage();
  }, []);

  if (!coherenceLinks || coherenceLinks.size === 0) return null;

  return (
    <div>
      Don&#39;t forget to update the following linked questions:
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
