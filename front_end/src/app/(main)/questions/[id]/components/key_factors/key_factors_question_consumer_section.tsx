"use client";

import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { firstVisible } from "@/app/(main)/questions/[id]/components/key_factors/utils";
import { useBreakpoint } from "@/hooks/tailwind";
import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { KeyFactorItem } from "./item_view";
import KeyFactorsCarousel from "./key_factors_carousel";
import { useQuestionLayout } from "../question_layout/question_layout_context";

type Props = {
  keyFactors: KeyFactor[];
};

const MAX_TOP_KEY_FACTORS = 8;

const KeyFactorsQuestionConsumerSection: FC<Props> = ({ keyFactors }) => {
  const t = useTranslations();
  const isDesktop = useBreakpoint("sm");
  const scrollTo = useScrollTo();
  const { requestKeyFactorsExpand } = useQuestionLayout();

  // Filter and limit top key factors by freshness
  const topKeyFactors = useMemo(() => {
    return keyFactors
      .sort((a, b) => b.freshness - a.freshness)
      .slice(0, MAX_TOP_KEY_FACTORS);
  }, [keyFactors]);

  const openKeyFactorsElement = (selector: string) => {
    // Expand key factors section
    requestKeyFactorsExpand();

    // Scroll to the specific key factor in the full list
    setTimeout(() => {
      // Small workaround: the page renders two KeyFactor sections:
      // one for mobile, one for desktop — for responsive purposes.
      // This causes duplicate key-factor element IDs in the DOM.
      // As a result, using getElementById might return
      // the hidden version (not visible on the current device).
      // To avoid this, we use a small hack that returns
      // the first visible element instead.
      const keyFactorElement = firstVisible(selector);

      if (keyFactorElement) {
        scrollTo(keyFactorElement.getBoundingClientRect().top);
      }
    }, 100);

    sendAnalyticsEvent("KeyFactorClick", {
      event_label: "fromTopList",
    });
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
          {t("viewAll", { count: keyFactors.length })}
        </button>
      </div>

      <KeyFactorsCarousel
        listClassName="pb-0 [&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
        items={topKeyFactors}
        renderItem={(kf) => (
          <button
            className="text-left no-underline"
            onClick={(e) => {
              e.preventDefault();
              openKeyFactorsElement(`[id="key-factor-${kf.id}"]`);
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
