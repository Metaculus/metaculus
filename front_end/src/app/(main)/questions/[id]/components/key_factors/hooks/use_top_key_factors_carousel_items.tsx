"use client";

import { useMemo } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { KeyFactor } from "@/types/comment";

export const MAX_TOP_KEY_FACTORS = 8;

export type TopItem =
  | { kind: "keyFactor"; keyFactor: KeyFactor }
  | { kind: "questionLink"; link: FetchedAggregateCoherenceLink };

type Params = {
  keyFactors: KeyFactor[];
  limit?: number | null;
  sortMode?: "freshness" | "strength";
};

function applyLimit<T>(arr: T[], limit?: number | null): T[] {
  if (limit == null) return arr;
  if (!Number.isFinite(limit)) return arr;
  if (limit <= 0) return [];
  return arr.slice(0, limit);
}

export function useTopKeyFactorsCarouselItems({
  keyFactors,
  limit,
  sortMode = "freshness",
}: Params) {
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();

  const topKeyFactors = useMemo(() => {
    const sorted = [...keyFactors].sort((a, b) => {
      if (sortMode === "strength") {
        const as = a.vote?.score ?? 0;
        const bs = b.vote?.score ?? 0;
        if (bs !== as) return bs - as;
        if (b.freshness !== a.freshness) return b.freshness - a.freshness;
        return b.id - a.id;
      }

      return b.freshness - a.freshness;
    });

    return applyLimit(sorted, limit);
  }, [keyFactors, limit, sortMode]);

  const questionLinkAggregates: FetchedAggregateCoherenceLink[] = useMemo(
    () =>
      aggregateCoherenceLinks?.data.filter(
        (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
      ) ?? [],
    [aggregateCoherenceLinks]
  );

  const topQuestionLinks = useMemo(() => {
    const sorted = [...questionLinkAggregates].sort(
      (a, b) =>
        (b.links_nr ?? 0) - (a.links_nr ?? 0) ||
        (b.strength ?? 0) - (a.strength ?? 0)
    );
    return applyLimit(sorted, limit);
  }, [questionLinkAggregates, limit]);

  const items: TopItem[] = useMemo(() => {
    const combined: TopItem[] = [
      ...topKeyFactors.map(
        (kf): TopItem => ({ kind: "keyFactor", keyFactor: kf })
      ),
      ...topQuestionLinks.map(
        (link): TopItem => ({ kind: "questionLink", link })
      ),
    ];
    return applyLimit(combined, limit);
  }, [topKeyFactors, topQuestionLinks, limit]);

  const totalCount = useMemo(
    () => keyFactors.length + questionLinkAggregates.length,
    [keyFactors.length, questionLinkAggregates.length]
  );

  return {
    items,
    totalCount,
    topKeyFactors,
    topQuestionLinks,
    questionLinkAggregates,
  };
}
