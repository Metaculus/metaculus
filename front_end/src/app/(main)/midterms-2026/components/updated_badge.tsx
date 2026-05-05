"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

type Props = {
  /** Latest update timestamp (ISO or epoch ms) */
  timestamp: string | number | null;
};

const UpdatedBadge: FC<Props> = ({ timestamp }) => {
  const t = useTranslations();
  const [label, setLabel] = useState(() => formatRelative(timestamp));

  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => setLabel(formatRelative(timestamp)), 60_000);
    return () => clearInterval(id);
  }, [timestamp]);

  if (!timestamp) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint-500 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-mint-500" />
      </span>
      {t("midtermsHubUpdatedAgo", { time: label })}
    </span>
  );
};

function formatRelative(timestamp: string | number | null): string {
  if (!timestamp) return "";
  const then =
    typeof timestamp === "number" ? timestamp : Date.parse(timestamp);
  if (Number.isNaN(then)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d`;
}

export default UpdatedBadge;
