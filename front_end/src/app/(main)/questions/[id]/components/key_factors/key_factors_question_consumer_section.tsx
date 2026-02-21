"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { openKeyFactorsSectionAndScrollTo } from "@/app/(main)/questions/[id]/components/key_factors/utils";
import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import KeyFactorsConsumerCarousel from "./key_factors_consumer_carousel";
import { useShouldHideKeyFactors } from "./use_should_hide_key_factors";
import { useQuestionLayout } from "../question_layout/question_layout_context";
import {
  MAX_TOP_KEY_FACTORS,
  useTopKeyFactorsCarouselItems,
} from "./hooks/use_top_key_factors_carousel_items";

type Props = {
  keyFactors: KeyFactor[];
  post: PostWithForecasts;
};

const KeyFactorsQuestionConsumerSection: FC<Props> = ({ keyFactors, post }) => {
  const t = useTranslations();
  const { requestKeyFactorsExpand } = useQuestionLayout();
  const shouldHideKeyFactors = useShouldHideKeyFactors();

  const { items: topItems, totalCount } = useTopKeyFactorsCarouselItems({
    keyFactors,
    limit: MAX_TOP_KEY_FACTORS,
  });

  if (shouldHideKeyFactors) return null;

  const openKeyFactorsElement = (selector: string) => {
    requestKeyFactorsExpand?.();
    openKeyFactorsSectionAndScrollTo({ selector, mobileOnly: false });
    sendAnalyticsEvent("KeyFactorClick", { event_label: "fromTopList" });
  };

  if (topItems.length === 0) return null;

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

      <KeyFactorsConsumerCarousel post={post} items={topItems} />
    </div>
  );
};

export default KeyFactorsQuestionConsumerSection;
