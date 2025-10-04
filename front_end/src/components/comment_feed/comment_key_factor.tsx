"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";

type Props = {
  keyFactor: KeyFactor;
};

const CommentKeyFactor: FC<Props> = ({
  keyFactor: {
    driver: { text },
  },
}) => {
  const t = useTranslations();
  const scrollTo = useScrollTo();

  return (
    <div className="left-5 top-5 order-none mb-2 box-border flex flex-col items-center gap-1.5 rounded border border-blue-500 bg-blue-300 p-3 dark:border-blue-500-dark dark:bg-blue-300-dark md:flex-row md:gap-3">
      <div className="w-full text-nowrap text-xs uppercase text-gray-500 dark:text-gray-600-dark md:w-fit">
        {t("keyFactor")}
      </div>
      <a
        href="#key-factors"
        className="w-full text-sm text-blue-800 no-underline hover:underline dark:text-blue-800-dark md:w-fit"
        onClick={(e) => {
          e.preventDefault();
          const target = document.getElementById("key-factors");
          if (target) {
            scrollTo(target.getBoundingClientRect().top);
          }
          sendAnalyticsEvent("KeyFactorClick", {
            event_label: "fromComment",
          });
        }}
      >
        {text}
      </a>
    </div>
  );
};

export default CommentKeyFactor;
