"use client";

import { useLocale, useTranslations } from "next-intl";
import { ReactNode } from "react";

import cn from "@/utils/core/cn";

import { TokenHoverCard, tokenBaseClassName } from "./token_hover_card";
import { GHM_SOURCES } from "../../config/sources";
import { SourceSnapshot } from "../../editions/types";
import { formatEditionDate } from "../../helpers/format";

export function DataPoint({
  s,
  children,
}: {
  s: SourceSnapshot;
  children?: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const source = GHM_SOURCES[s.source];

  return (
    <TokenHoverCard
      href={s.url ?? source.url}
      external
      content={
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium uppercase tracking-wide text-olive-800 dark:text-olive-800-dark">
            {t("globalHealthMonitorLatestData")}
          </div>
          <div className="font-medium text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
            {s.label}
          </div>
          <div className="text-xl font-bold leading-none text-gray-900 dark:text-gray-900-dark">
            {s.value}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-600-dark">
            {t("globalHealthMonitorSourceAsOf", {
              source: source.name,
              date: formatEditionDate(s.asOf, locale),
            })}
          </div>
        </div>
      }
      className={cn(
        tokenBaseClassName,
        "text-inherit decoration-olive-600 decoration-dotted decoration-2 hover:bg-olive-300 dark:decoration-olive-600-dark dark:hover:bg-olive-300-dark"
      )}
      dataAttributes={{ "data-ghm-source": s.source, "data-ghm-as-of": s.asOf }}
    >
      {children ?? s.value}
    </TokenHoverCard>
  );
}
