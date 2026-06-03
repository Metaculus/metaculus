import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { PostWithForecasts } from "@/types/post";

import ChamberRowTooltip from "./chamber_row_tooltip";
import { MIDTERMS_COLORS } from "../constants";
import CvBar, { ThemedColor } from "./cv_bar";
import { CONGRESS_OUTCOME_LABELS } from "../data";
import { ChamberData } from "../helpers/fetch_dashboard_data";
import { getMultipleChoiceOptionProbability } from "../helpers/post_utils";

const DEM_FILL: ThemedColor = {
  light: MIDTERMS_COLORS.demPrimary,
  dark: MIDTERMS_COLORS.demPrimaryDark,
};
const DEM_BORDER: ThemedColor = {
  light: MIDTERMS_COLORS.demBorder,
  dark: MIDTERMS_COLORS.demBorderDark,
};
const REP_FILL: ThemedColor = {
  light: MIDTERMS_COLORS.repPrimary,
  dark: MIDTERMS_COLORS.repPrimaryDark,
};
const REP_BORDER: ThemedColor = {
  light: MIDTERMS_COLORS.repBorder,
  dark: MIDTERMS_COLORS.repBorderDark,
};

const CURRENT_SENATE = { dem: 47, rep: 53 };
const CURRENT_HOUSE = { dem: 215, rep: 220 };

// Sums several option probabilities of a multiple-choice post; null if any
// option is missing.
function sumOptions(
  post: PostWithForecasts | null,
  labels: string[]
): number | null {
  let total = 0;
  for (const label of labels) {
    const p = getMultipleChoiceOptionProbability(post, label);
    if (p == null) return null;
    total += p;
  }
  return total;
}

type Props = {
  data: ChamberData;
};

export default async function ChamberControlCard({ data }: Props) {
  const t = await getTranslations();

  const labels = {
    forecast: t("midtermsHubChamberForecast"),
    current: t("midtermsHubChamberCurrent"),
    democrats: t("midtermsHubPartyDemocrats"),
    republicans: t("midtermsHubPartyRepublicans"),
  };

  // Both chambers' marginals are derived from the single congress-control
  // question (#34484) by summing the relevant two-chamber outcomes.
  const co = data.congressOutcome;
  const houseDemProb = sumOptions(co, [
    CONGRESS_OUTCOME_LABELS.DD,
    CONGRESS_OUTCOME_LABELS.RD,
  ]);
  const houseRepProb = sumOptions(co, [
    CONGRESS_OUTCOME_LABELS.RR,
    CONGRESS_OUTCOME_LABELS.DR,
  ]);
  const senateDemProb = sumOptions(co, [
    CONGRESS_OUTCOME_LABELS.DD,
    CONGRESS_OUTCOME_LABELS.DR,
  ]);
  const senateRepProb = sumOptions(co, [
    CONGRESS_OUTCOME_LABELS.RR,
    CONGRESS_OUTCOME_LABELS.RD,
  ]);

  const senateLabel = t("midtermsHubChamberSenate");
  const houseLabel = t("midtermsHubChamberHouse");

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-5 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <h3 className="m-0 mb-5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
        {t("midtermsHubChamberControl")}
      </h3>
      <div className="space-y-5">
        <ChamberRow
          chamberLabel={houseLabel}
          demProb={houseDemProb}
          repProb={houseRepProb}
          currentDem={CURRENT_HOUSE.dem}
          currentRep={CURRENT_HOUSE.rep}
          tooltipBody={buildTooltipBody({
            t,
            chamberLabel: houseLabel,
            demProb: houseDemProb,
            repProb: houseRepProb,
            labels,
          })}
          labels={labels}
        />
        <ChamberRow
          chamberLabel={senateLabel}
          demProb={senateDemProb}
          repProb={senateRepProb}
          currentDem={CURRENT_SENATE.dem}
          currentRep={CURRENT_SENATE.rep}
          tooltipBody={buildTooltipBody({
            t,
            chamberLabel: senateLabel,
            demProb: senateDemProb,
            repProb: senateRepProb,
            labels,
          })}
          labels={labels}
        />
      </div>
    </div>
  );
}

type Labels = {
  forecast: string;
  current: string;
  democrats: string;
  republicans: string;
};

function buildTooltipBody({
  t,
  chamberLabel,
  demProb,
  repProb,
  labels,
}: {
  t: Awaited<ReturnType<typeof getTranslations>>;
  chamberLabel: string;
  demProb: number | null;
  repProb: number | null;
  labels: Labels;
}): ReactNode | null {
  if (demProb == null || repProb == null) return null;

  // Frame around the party more likely to hold the most seats (a plurality),
  // not a majority — these are multiple-choice control questions.
  const demFavored = demProb >= repProb;
  const favoredParty = demFavored ? labels.democrats : labels.republicans;
  const favoredProb = demFavored ? demProb : repProb;
  const favoredPct = Math.round(favoredProb * 1000) / 10;

  return t.rich("midtermsHubChamberTooltipBody", {
    party: favoredParty,
    chamber: chamberLabel,
    pct: favoredPct,
    b: (chunks) => <strong className="font-bold">{chunks}</strong>,
  });
}

type RowProps = {
  chamberLabel: string;
  demProb: number | null;
  repProb: number | null;
  currentDem: number;
  currentRep: number;
  tooltipBody: ReactNode | null;
  labels: Labels;
};

function ChamberRow({
  chamberLabel,
  demProb,
  repProb,
  currentDem,
  currentRep,
  tooltipBody,
  labels,
}: RowProps) {
  // Normalize Dem+Rep so the two bars together represent ~100% (ignores
  // the small "Other" slice from the underlying multiple-choice question).
  const total = demProb != null && repProb != null ? demProb + repProb : null;
  const demShare =
    demProb != null && total && total > 0 ? (demProb / total) * 100 : null;
  const repShare = demShare != null ? 100 - demShare : null;

  const demPct = demProb != null ? Math.round(demProb * 1000) / 10 : null;
  const repPct = repProb != null ? Math.round(repProb * 1000) / 10 : null;

  const slash = (
    // 50% opacity separator shared by Forecast and Current rows.
    <span className="opacity-50">{" / "}</span>
  );

  const content = (
    <div className="group/cv block">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-blue-800 dark:text-blue-800-dark">
          {chamberLabel}
        </span>
        {demPct != null && repPct != null && (
          <span className="whitespace-nowrap text-sm tabular-nums text-blue-700 dark:text-blue-700-dark">
            <span className="mr-1">{labels.forecast}</span>
            <span style={{ color: MIDTERMS_COLORS.demPrimary }}>{demPct}%</span>
            {slash}
            <span style={{ color: MIDTERMS_COLORS.repPrimary }}>{repPct}%</span>
          </span>
        )}
      </div>
      {demShare != null && repShare != null && (
        <div
          className="grid w-full items-center gap-1"
          style={{ gridTemplateColumns: `${demShare}fr ${repShare}fr` }}
        >
          <CvBar fill color={DEM_FILL} borderColor={DEM_BORDER} />
          <CvBar fill color={REP_FILL} borderColor={REP_BORDER} />
        </div>
      )}
      <div className="mt-2 text-center text-sm tabular-nums text-blue-700 dark:text-blue-700-dark">
        <span className="mr-1">{labels.current}</span>
        <span style={{ color: MIDTERMS_COLORS.demPrimary }}>
          D {currentDem}
        </span>
        {slash}
        <span style={{ color: MIDTERMS_COLORS.repPrimary }}>
          R {currentRep}
        </span>
      </div>
    </div>
  );

  if (!tooltipBody) return content;

  return <ChamberRowTooltip body={tooltipBody}>{content}</ChamberRowTooltip>;
}
