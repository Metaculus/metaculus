"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { useBreakpoint } from "@/hooks/tailwind";
import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { KeyFactorItem } from "./key_factor_item";
import KeyFactorsCarousel from "./key_factors_carousel";
import { useQuestionLayout } from "../question_layout/question_layout_context";

type Props = {
  keyFactors: KeyFactor[];
};

// TODO: adjust!
const MAX_TOP_KEY_FACTORS = 3;

const KeyFactorsQuestionConsumerSection: FC<Props> = ({ keyFactors }) => {
  const t = useTranslations();
  const isDesktop = useBreakpoint("sm");
  const scrollTo = useScrollTo();
  const { requestKeyFactorsExpand } = useQuestionLayout();

  console.log(keyFactors);

  // Filter and limit top key factors by freshness
  const topKeyFactors = useMemo(() => {
    return keyFactors
      .sort((a, b) => b.freshness - a.freshness)
      .slice(0, MAX_TOP_KEY_FACTORS);
  }, [keyFactors]);

  const handleViewAllClick = () => {
    requestKeyFactorsExpand();

    setTimeout(() => {
      // TODO: not working since there are 2 ids
      const section = document.getElementById("key-factors");
      if (section) {
        scrollTo(section.getBoundingClientRect().top);
      }
    }, 100);
  };

  // Don't render if no top key factors
  if (topKeyFactors.length === 0) {
    return null;
  }

  return (
    <div
      className="-ml-4 mt-8 flex w-[calc(100%+32px)] flex-col pb-4 sm:ml-0 sm:w-full"
      id="top-key-factors"
    >
      <div className="mb-4 flex items-center justify-between pl-4 sm:pl-0">
        <div className="text-sm text-blue-800 dark:text-blue-800-dark">
          {t("topKeyFactors")}
        </div>
        {keyFactors.length > topKeyFactors.length && (
          <button
            onClick={handleViewAllClick}
            className="text-sm text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-600-dark"
          >
            View all ({keyFactors.length})
          </button>
        )}
      </div>

      <KeyFactorsCarousel
        listClassName="pb-0 [&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
        items={topKeyFactors}
        renderItem={(kf) => (
          <button
            className="text-left no-underline"
            onClick={(e) => {
              e.preventDefault();

              // Expand key factors section
              requestKeyFactorsExpand();

              // Scroll to the specific key factor in the full list
              setTimeout(() => {
                const keyFactorElement = document.getElementById(
                  `key-factor-${kf.id}`
                );
                if (keyFactorElement) {
                  scrollTo(keyFactorElement.getBoundingClientRect().top);
                } else {
                  // Fallback: scroll to key factors section
                  const section = document.getElementById("key-factors");
                  if (section) {
                    scrollTo(section.getBoundingClientRect().top);
                  }
                }
              }, 100);

              sendAnalyticsEvent("KeyFactorClick", {
                event_label: "fromTopList",
              });
            }}
          >
            <KeyFactorItem
              keyFactor={kf}
              mode={"consumer"}
              isCompact={!isDesktop}
              className="sm:max-w-[200px]"
            />
          </button>
        )}
      />
    </div>
  );
};

export default KeyFactorsQuestionConsumerSection;
