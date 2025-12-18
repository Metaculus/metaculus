"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { openKeyFactorsSectionAndScrollTo } from "@/app/(main)/questions/[id]/components/key_factors/utils";
import { useBreakpoint } from "@/hooks/tailwind";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { KeyFactorItem } from "./item_view";
import QuestionLinkKeyFactorItem from "./item_view/question_link/question_link_key_factor_item";
import KeyFactorsCarousel from "./key_factors_carousel";
import { useQuestionLayout } from "../question_layout/question_layout_context";

type Props = {
  keyFactors: KeyFactor[];
  post: PostWithForecasts;
};

const MAX_TOP_KEY_FACTORS = 8;

type TopItem =
  | { kind: "keyFactor"; keyFactor: KeyFactor }
  | { kind: "questionLink"; link: FetchedAggregateCoherenceLink };

const KeyFactorsQuestionConsumerSection: FC<Props> = ({ keyFactors, post }) => {
  const t = useTranslations();
  const isDesktop = useBreakpoint("sm");
  const { requestKeyFactorsExpand } = useQuestionLayout();
  const { aggregateCoherenceLinks } = useCoherenceLinksContext();

  const topKeyFactors = useMemo(
    () =>
      [...keyFactors]
        .sort((a, b) => b.freshness - a.freshness)
        .slice(0, MAX_TOP_KEY_FACTORS),
    [keyFactors]
  );

  const questionLinkAggregates: FetchedAggregateCoherenceLink[] = useMemo(
    () =>
      aggregateCoherenceLinks?.data.filter(
        (it) => it.links_nr > 1 && it.strength !== null && it.direction !== null
      ) ?? [],
    [aggregateCoherenceLinks]
  );

  const topQuestionLinks = useMemo(
    () =>
      [...questionLinkAggregates]
        .sort(
          (a, b) =>
            (b.links_nr ?? 0) - (a.links_nr ?? 0) ||
            (b.strength ?? 0) - (a.strength ?? 0)
        )
        .slice(0, MAX_TOP_KEY_FACTORS),
    [questionLinkAggregates]
  );

  const topItems: TopItem[] = useMemo(() => {
    const items: TopItem[] = [
      ...topKeyFactors.map(
        (kf): TopItem => ({ kind: "keyFactor", keyFactor: kf })
      ),
      ...topQuestionLinks.map(
        (link): TopItem => ({ kind: "questionLink", link })
      ),
    ];
    return items.slice(0, MAX_TOP_KEY_FACTORS);
  }, [topKeyFactors, topQuestionLinks]);

  const totalCount = keyFactors.length + questionLinkAggregates.length;

  const openKeyFactorsElement = (selector: string) => {
    requestKeyFactorsExpand?.();

    openKeyFactorsSectionAndScrollTo({
      selector,
      mobileOnly: false,
    });

    sendAnalyticsEvent("KeyFactorClick", {
      event_label: "fromTopList",
    });
  };

  if (topItems.length === 0) {
    return null;
  }

  return (
    <div
      className="-ml-4 mt-8 flex w-[calc(100%+32px)] flex-col pb-4 sm:ml-0 sm:w-full"
      id="top-key-factors"
    >
      <div className="mb-4 flex items-center justify-between px-4 sm:px-0">
        <div className="text-sm text-blue-800 dark:text-blue-800-dark">
          {t("topKeyFactors")}
        </div>
        <button
          onClick={() => {
            openKeyFactorsElement("[id='key-factors']");
            sendAnalyticsEvent("KeyFactorViewAllClick");
          }}
          className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-600-dark"
        >
          {t("viewAll", { count: totalCount })}
        </button>
      </div>

      <KeyFactorsCarousel
        listClassName="pb-0 [&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
        items={topItems}
        renderItem={(item) =>
          item.kind === "keyFactor" ? (
            <button
              className="text-left no-underline"
              onClick={(e) => {
                e.preventDefault();
                openKeyFactorsElement(`[id="key-factor-${item.keyFactor.id}"]`);
                sendAnalyticsEvent("KeyFactorClick", {
                  event_label: "fromTopList",
                });
              }}
            >
              <KeyFactorItem
                keyFactor={item.keyFactor}
                mode="consumer"
                isCompact={!isDesktop}
                className="sm:max-w-[200px]"
              />
            </button>
          ) : (
            <button
              className="text-left no-underline"
              onClick={(e) => {
                e.preventDefault();
                openKeyFactorsElement(
                  `[id="question-link-kf-${item.link.id}"]`
                );
              }}
            >
              <QuestionLinkKeyFactorItem
                link={item.link}
                post={post}
                mode="consumer"
                compact={!isDesktop}
                linkToComment={false}
              />
            </button>
          )
        }
      />
    </div>
  );
};

export default KeyFactorsQuestionConsumerSection;
