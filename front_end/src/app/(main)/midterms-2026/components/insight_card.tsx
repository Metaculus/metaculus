"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { CommentType, KeyFactor } from "@/types/comment";
import cn from "@/utils/core/cn";

import { CommunityInsight } from "../helpers/fetch_community_insights";

type Props = {
  insight: CommunityInsight;
};

const InsightCard: FC<Props> = ({ insight }) => {
  const t = useTranslations();

  const isKeyFactor = insight.type === "key-factor";
  const text = isKeyFactor
    ? extractKeyFactorText(insight.keyFactor)
    : extractCommentText(insight.comment);
  const forecasters = insight.race.post?.forecasts_count ?? 0;
  const sourceTitle = insight.race.post?.title ?? insight.race.name;
  const link = insight.race.post ? `/questions/${insight.race.post.id}` : "#";

  return (
    <Link
      href={link}
      className={cn(
        "flex h-full w-[320px] shrink-0 snap-start flex-col gap-4 rounded-xl border bg-gray-0 p-5 transition-colors hover:border-gray-400 dark:bg-gray-0-dark dark:hover:border-gray-400-dark",
        isKeyFactor
          ? "border-orange-200 dark:border-orange-200-dark"
          : "border-blue-300 dark:border-blue-300-dark"
      )}
    >
      <span
        className={cn(
          "inline-block w-fit rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
          isKeyFactor
            ? "bg-orange-100 text-orange-800 dark:bg-orange-100-dark dark:text-orange-800-dark"
            : "bg-blue-200 text-blue-800 dark:bg-blue-200-dark dark:text-blue-800-dark"
        )}
      >
        {isKeyFactor ? t("midtermsHubKeyFactor") : t("midtermsHubTopComment")}
      </span>
      <p className="m-0 line-clamp-5 flex-1 text-sm leading-relaxed text-gray-800 dark:text-gray-800-dark">
        {text}
      </p>
      <div className="text-xs text-gray-600 dark:text-gray-600-dark">
        <span className="line-clamp-1 font-medium">{sourceTitle}</span>
        <span className="text-gray-500 dark:text-gray-500-dark">
          {" · "}
          {t("midtermsHubForecastersCount", { count: forecasters })}
        </span>
      </div>
    </Link>
  );
};

function extractKeyFactorText(kf: KeyFactor): string {
  if (kf.driver?.text) return kf.driver.text;
  if (kf.news?.title) return kf.news.title;
  if (kf.base_rate?.reference_class) {
    const projected = kf.base_rate.projected_value;
    const unit = kf.base_rate.unit;
    if (projected != null && unit) {
      return `${kf.base_rate.reference_class}: ${projected}${unit}`;
    }
    return kf.base_rate.reference_class;
  }
  return "";
}

function extractCommentText(comment: CommentType): string {
  return stripMarkdown(comment.text).slice(0, 280);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

export default InsightCard;
