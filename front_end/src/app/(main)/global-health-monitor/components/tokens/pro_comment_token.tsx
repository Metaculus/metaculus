"use client";

import { useLocale, useTranslations } from "next-intl";
import { ReactNode } from "react";

import cn from "@/utils/core/cn";

import { TokenHoverCard, tokenBaseClassName } from "./token_hover_card";
import { ProCommentRef } from "../../editions/types";
import { formatIsoDate } from "../../helpers/format";
import { getCommentHref } from "../../helpers/links";

export function ProComment({
  c,
  children,
}: {
  c: ProCommentRef;
  children: ReactNode;
}) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <TokenHoverCard
      href={getCommentHref(c)}
      external
      content={
        <div className="flex flex-col gap-2">
          <p className="m-0 line-clamp-6 italic text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
            “{c.excerpt}”
          </p>
          <div className="text-xs text-purple-800 dark:text-purple-800-dark">
            <span className="font-bold">{c.author}</span> ·{" "}
            {t("globalHealthMonitorProForecaster")} ·{" "}
            {formatIsoDate(c.date, locale)}
          </div>
        </div>
      }
      className={cn(
        tokenBaseClassName,
        "text-inherit decoration-purple-500 hover:bg-purple-200 dark:decoration-purple-500-dark dark:hover:bg-purple-200-dark"
      )}
      dataAttributes={{ "data-ghm-comment": c.commentId }}
    >
      {children}
    </TokenHoverCard>
  );
}
