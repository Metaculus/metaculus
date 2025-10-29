"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useBreakpoint } from "@/hooks/tailwind";
import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";

import { KeyFactorItem } from "./key_factor_item";
import KeyFactorsCarousel from "./key_factors_carousel";

type Props = {
  keyFactors: KeyFactor[];
};

const KeyFactorsConsumerSection: FC<Props> = ({ keyFactors }) => {
  const t = useTranslations();
  const isDesktop = useBreakpoint("sm");
  const scrollTo = useScrollTo();

  return (
    <div
      className="-ml-4 mt-8 flex w-[calc(100%+32px)] flex-col pb-4 sm:ml-0 sm:w-full"
      id="key-factors"
    >
      <div className="mb-4 pl-4 text-sm text-blue-800 dark:text-blue-800-dark sm:pl-0">
        {t("topKeyFactors")}
      </div>

      <KeyFactorsCarousel
        listClassName="pb-0 [&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
        items={keyFactors}
        renderItem={(kf) => (
          <Link
            href={`#comment-${kf.comment_id}`}
            className="no-underline"
            onClick={(e) => {
              const target = document.getElementById(
                `comment-${kf.comment_id}`
              );
              if (target) {
                e.preventDefault();
                scrollTo(target.getBoundingClientRect().top);
              }
              sendAnalyticsEvent("KeyFactorClick", {
                event_label: "fromList",
              });
            }}
          >
            <KeyFactorItem
              keyFactor={kf}
              mode={"consumer"}
              isCompact={!isDesktop}
              className="sm:max-w-[200px]"
            />
          </Link>
        )}
      />
    </div>
  );
};

export default KeyFactorsConsumerSection;
