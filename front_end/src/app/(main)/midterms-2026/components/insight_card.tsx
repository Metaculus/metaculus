"use client";

import { faArrowRight, faChartLine } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";
import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/formatters/date";
import { stripMarkdown } from "@/utils/markdown";

import { CommunityInsight } from "../helpers/fetch_community_insights";

// Enough text to fill the taller body; the line clamp does the final trimming so
// an excerpt never ends on a visibly chopped word mid-line.
const EXCERPT_CHARS = 600;

type Props = {
  insight: CommunityInsight;
};

const InsightCard: FC<Props> = ({ insight }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { comment, sourcePost } = insight;
  // Comments are fetched per post, so for the Senate / Governor group posts this
  // is the umbrella question title rather than the individual state race.
  const questionTitle = sourcePost.short_title || sourcePost.title;

  return (
    <Link
      href={`/questions/${sourcePost.id}/#comment-${comment.id}`}
      // A ceiling rather than a fixed height: a short comment lets the card
      // shrink to its content, and overflow-hidden is the backstop that keeps a
      // long one from spilling past the cap (the body's line clamp normally
      // gets there first).
      className="group flex max-h-[270px] flex-col overflow-hidden rounded-lg border border-blue-400 bg-blue-200 no-underline transition-colors hover:border-blue-500 dark:border-blue-400-dark dark:bg-blue-200-dark dark:hover:border-blue-500-dark"
    >
      {/* Context strip: which question the comment is about. */}
      <div className="flex shrink-0 items-start gap-2 border-b border-blue-400 px-3.5 py-2.5 dark:border-blue-400-dark">
        <FontAwesomeIcon
          icon={faChartLine}
          className="mt-0.5 size-3 shrink-0 text-blue-600 dark:text-blue-600-dark"
        />
        {/* Wraps to a second line only when the title needs it — short titles
            keep the strip to one line. */}
        <span className="line-clamp-2 text-xs font-medium leading-snug text-blue-700 dark:text-blue-700-dark">
          {questionTitle}
        </span>
      </div>

      {/* The comment is the point of the card — largest type, all the room.
          py-3 rather than py-3.5: six lines of 22.75px plus 24px of padding is
          what still clears the 270px cap when the title above wraps to two
          lines (54px strip + 53px footer), so the last line never gets shaved. */}
      <div className="min-h-0 flex-1 overflow-hidden px-3.5 py-3">
        <p className="m-0 line-clamp-6 text-sm leading-relaxed text-blue-800 dark:text-blue-800-dark">
          {extractCommentText(comment)}
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-blue-400 px-3.5 py-2.5 dark:border-blue-400-dark">
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-blue-700 dark:text-blue-700-dark">
            {comment.author.username}
          </div>
          {/* The treatment comment_card.tsx uses, not CommentDate: that renders
              its own anchor, and this card is already a Link. P1D keeps recent
              comments relative and everything older an explicit date, and the
              prefix comes from `onDate` because the element's own default is a
              hardcoded English "on". The children are the server-rendered
              fallback — without them the timestamp is blank until the custom
              element upgrades. */}
          <div className="text-xs font-medium text-blue-600 dark:text-blue-600-dark">
            <RelativeTime
              datetime={comment.created_at}
              format="relative"
              threshold="P1D"
              prefix={t("onDate", { date: "" }).trim()}
              year="numeric"
              month="short"
              day="numeric"
            >
              {t("onDate", {
                date: formatDate(locale, new Date(comment.created_at)),
              })}
            </RelativeTime>
          </div>
        </div>
        {/* A plain arrow, not the open-in-new-window glyph: this navigates in
            the current tab, and the external-link icon would promise otherwise. */}
        <FontAwesomeIcon
          icon={faArrowRight}
          className="size-3 shrink-0 text-blue-600 opacity-70 transition-opacity group-hover:opacity-100 dark:text-blue-600-dark"
        />
      </div>
    </Link>
  );
};

function extractCommentText(comment: CommentType): string {
  return stripMarkdown(comment.text).slice(0, EXCERPT_CHARS);
}

export default InsightCard;
