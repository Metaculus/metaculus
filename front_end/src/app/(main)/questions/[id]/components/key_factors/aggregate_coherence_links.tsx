"use client";

import posthog from "posthog-js";
import { FC } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import DisplayCoherenceLink from "@/app/(main)/questions/components/coherence_links/display_coherence_link";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { PostWithForecasts } from "@/types/post";

type Props = {
  post: PostWithForecasts;
};

const AggregateCoherenceLinks: FC<Props> = ({ post }) => {
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();

  const displayedAggregateLinks = aggregateCoherenceLinks?.data.filter(
    (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
  );

  if (
    !posthog.getFeatureFlag("aggregate_question_links") ||
    !displayedAggregateLinks ||
    displayedAggregateLinks?.length === 0
  ) {
    return;
  }

  return (
    <>
      <div className="mb-2 mt-2 text-[16px] leading-[24px] text-blue-900 dark:text-blue-900-dark">
        Aggregate Question Links
      </div>
      {Array.from(
        displayedAggregateLinks,
        (link: FetchedAggregateCoherenceLink) => (
          <div key={link.id}>
            <DisplayCoherenceLink
              link={link}
              post={post}
              compact={false}
            ></DisplayCoherenceLink>
            <br></br>
          </div>
        )
      )}
    </>
  );
};

export default AggregateCoherenceLinks;
