"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { MIDTERMS_COLORS } from "../constants";
import {
  SenateRaceWithQuestion,
  summarizeRaceLeans,
} from "../helpers/post_utils";
import { useIsDark } from "../helpers/use_is_dark";

type Props = {
  races: SenateRaceWithQuestion[];
  /** Appends a toss-up count to the lean sentence. The Senate map uses it: with
   *  a third of the chamber up, which seats are still in play says more than the
   *  lean split alone. Omitted on the Governor map, where the count would be
   *  noise next to 19 mostly-settled races. */
  withCloseRaces?: boolean;
  className?: string;
};

const RaceLeanSummary: FC<Props> = ({ races, withCloseRaces, className }) => {
  const t = useTranslations();
  const isDark = useIsDark();
  const leans = summarizeRaceLeans(races);
  if (!leans) return null;

  // Name the side ahead in more races; the remainder is implied. A tie resolves
  // to the Democrats so the copy stays deterministic across renders.
  const demLeads = leans.dem >= leans.rep;

  // Same light/dark pairing the chart strokes and CvBar use: the darker border
  // tone reads on the white card, the brighter tone on the navy one. Follows the
  // leading party, so this flips to red on its own if forecasts move.
  const partyColor = demLeads
    ? isDark
      ? MIDTERMS_COLORS.demPrimaryDark
      : MIDTERMS_COLORS.demBorder
    : isDark
      ? MIDTERMS_COLORS.repPrimaryDark
      : MIDTERMS_COLORS.repBorder;

  return (
    <p
      className={cn(
        "m-0 text-center text-sm text-blue-700 [text-wrap:balance] dark:text-blue-700-dark",
        className
      )}
    >
      {t.rich("midtermsHubRaceLeanSummary", {
        count: demLeads ? leans.dem : leans.rep,
        total: leans.total,
        party: demLeads ? t("midtermsHubDemocrat") : t("midtermsHubRepublican"),
        b: (chunks) => (
          <strong className="font-semibold" style={{ color: partyColor }}>
            {chunks}
          </strong>
        ),
      })}
      {/* The separator lives here rather than in either message so translators
          don't inherit punctuation that only makes sense when both clauses are
          present. Dropped entirely when nothing is close. */}
      {withCloseRaces && leans.close > 0 && (
        <>
          <span
            aria-hidden
            className="mx-1.5 text-blue-500 dark:text-blue-500-dark"
          >
            &middot;
          </span>
          {t("midtermsHubCloseRacesSummary", { count: leans.close })}
        </>
      )}
    </p>
  );
};

export default RaceLeanSummary;
