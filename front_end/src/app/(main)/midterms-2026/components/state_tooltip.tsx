"use client";

import { faComment, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
import { SenateRaceWithPost } from "../helpers/post_utils";

type Props = {
  race: SenateRaceWithPost;
  demWinPct: number | null;
  forecasters: number;
  comments: number;
};

const StateTooltipContent: FC<Props> = ({
  race,
  demWinPct,
  forecasters,
  comments,
}) => {
  const t = useTranslations();
  const stateName = STATE_NAMES[race.state] ?? race.name;

  const isDem = demWinPct != null && demWinPct >= 50;
  const probLabel =
    demWinPct == null
      ? t("midtermsHubNoForecast")
      : isDem
        ? t("midtermsHubDemPct", { pct: demWinPct })
        : t("midtermsHubRepPct", { pct: 100 - demWinPct });

  return (
    <div className="min-w-[200px] space-y-2 rounded-lg border border-gray-300 bg-gray-0 p-3 shadow-lg dark:border-gray-300-dark dark:bg-gray-0-dark">
      <h4 className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-900-dark">
        {stateName}
      </h4>
      <div className="text-sm">
        <span
          className="font-semibold"
          style={{
            color: isDem
              ? MIDTERMS_COLORS.demPrimary
              : MIDTERMS_COLORS.repPrimary,
          }}
        >
          {probLabel}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500-dark">
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={faComment} className="h-3 w-3" />
          {comments}
        </span>
        <span className="flex items-center gap-1">
          <FontAwesomeIcon icon={faUsers} className="h-3 w-3" />
          {forecasters}
        </span>
      </div>
      {race.post && (
        <Link
          href={`/questions/${race.post.id}`}
          className="inline-block text-xs hover:underline"
          style={{ color: MIDTERMS_COLORS.demPrimary }}
        >
          {t("midtermsHubViewQuestion")}
        </Link>
      )}
    </div>
  );
};

export default StateTooltipContent;
