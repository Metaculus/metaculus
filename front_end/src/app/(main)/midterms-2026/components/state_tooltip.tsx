"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { MIDTERMS_COLORS, STATE_NAMES } from "../constants";
import { SenateRaceWithQuestion } from "../helpers/post_utils";

type Props = {
  race: SenateRaceWithQuestion;
  demWinPct: number | null;
};

const StateTooltipContent: FC<Props> = ({ race, demWinPct }) => {
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
    <div className="min-w-[200px] space-y-2 rounded-md border border-blue-300 bg-gray-0 p-3 shadow-lg dark:border-blue-300-dark dark:bg-gray-0-dark">
      <h4 className="m-0 text-sm font-semibold text-blue-800 dark:text-blue-800-dark">
        {stateName}
      </h4>
      <div className="text-sm tabular-nums">
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
      <p className="m-0 text-xs text-gray-700 underline decoration-gray-400 underline-offset-2 dark:text-gray-700-dark dark:decoration-gray-400-dark">
        {t("midtermsHubClickToView")}
      </p>
    </div>
  );
};

export default StateTooltipContent;
