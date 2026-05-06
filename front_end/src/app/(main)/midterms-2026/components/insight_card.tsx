"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { ActivityCard } from "@/app/(main)/labor-hub/components/activity_card";
import { CommentType } from "@/types/comment";

import { CommunityInsight } from "../helpers/fetch_community_insights";

type Props = {
  insight: CommunityInsight;
};

const InsightCard: FC<Props> = ({ insight }) => {
  const t = useTranslations();
  const { comment, sourcePost } = insight;

  return (
    <div className="w-[340px] shrink-0 snap-start [&_a]:no-underline [&_button]:no-underline">
      <ActivityCard
        variant="blue"
        username={comment.author.username}
        subtitle={t("midtermsHubMetaculusUser")}
        link={`/questions/${sourcePost.id}/#comment-${comment.id}`}
      >
        <p className="m-0 line-clamp-6">{extractCommentText(comment)}</p>
      </ActivityCard>
    </div>
  );
};

function extractCommentText(comment: CommentType): string {
  return stripMarkdown(comment.text).slice(0, 320);
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
