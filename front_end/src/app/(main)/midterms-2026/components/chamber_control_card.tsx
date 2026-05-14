import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import ChamberRowTooltip from "./chamber_row_tooltip";
import { MIDTERMS_COLORS } from "../constants";
import CvBar from "./cv_bar";
import { ChamberData } from "../helpers/fetch_dashboard_data";
import { getMultipleChoiceOptionProbability } from "../helpers/post_utils";

const CURRENT_SENATE = { dem: 47, rep: 53 };
const CURRENT_HOUSE = { dem: 215, rep: 220 };
const SENATE_TOTAL = 100;
const HOUSE_TOTAL = 435;

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
    disclaimer: t("midtermsHubChamberTooltipDisclaimer"),
  };

  const senateDemProb = getMultipleChoiceOptionProbability(
    data.senateControl,
    "Democrats"
  );
  const senateRepProb = getMultipleChoiceOptionProbability(
    data.senateControl,
    "Republicans"
  );
  const houseDemProb = getMultipleChoiceOptionProbability(
    data.houseControl,
    "Democrats"
  );
  const houseRepProb = getMultipleChoiceOptionProbability(
    data.houseControl,
    "Republicans"
  );

  const senateLabel = t("midtermsHubChamberSenate");
  const houseLabel = t("midtermsHubChamberHouse");

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-5 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <h3 className="m-0 mb-5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
        {t("midtermsHubChamberControl")}
      </h3>
      <div className="space-y-5">
        <ChamberRow
          chamberLabel={senateLabel}
          demProb={senateDemProb}
          repProb={senateRepProb}
          currentDem={CURRENT_SENATE.dem}
          currentRep={CURRENT_SENATE.rep}
          sourcePost={data.senateControl}
          tooltipBody={buildTooltipBody({
            t,
            chamberLabel: senateLabel,
            demProb: senateDemProb,
            repProb: senateRepProb,
            currentDem: CURRENT_SENATE.dem,
            currentRep: CURRENT_SENATE.rep,
            totalSeats: SENATE_TOTAL,
            labels,
          })}
          tooltipDisclaimer={labels.disclaimer}
          labels={labels}
        />
        <ChamberRow
          chamberLabel={houseLabel}
          demProb={houseDemProb}
          repProb={houseRepProb}
          currentDem={CURRENT_HOUSE.dem}
          currentRep={CURRENT_HOUSE.rep}
          sourcePost={data.houseControl}
          tooltipBody={buildTooltipBody({
            t,
            chamberLabel: houseLabel,
            demProb: houseDemProb,
            repProb: houseRepProb,
            currentDem: CURRENT_HOUSE.dem,
            currentRep: CURRENT_HOUSE.rep,
            totalSeats: HOUSE_TOTAL,
            labels,
          })}
          tooltipDisclaimer={labels.disclaimer}
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
  disclaimer: string;
};

function buildTooltipBody({
  t,
  chamberLabel,
  demProb,
  repProb,
  currentDem,
  currentRep,
  totalSeats,
  labels,
}: {
  t: Awaited<ReturnType<typeof getTranslations>>;
  chamberLabel: string;
  demProb: number | null;
  repProb: number | null;
  currentDem: number;
  currentRep: number;
  totalSeats: number;
  labels: Labels;
}): ReactNode | null {
  const demIsTrailing = currentDem <= currentRep;
  const trailingParty = demIsTrailing ? labels.democrats : labels.republicans;
  const trailingCurrent = demIsTrailing ? currentDem : currentRep;
  const seatsNeeded = Math.floor(totalSeats / 2) + 1 - trailingCurrent;
  const trailingProb = demIsTrailing ? demProb : repProb;
  const trailingProbPct =
    trailingProb != null ? Math.round(trailingProb * 1000) / 10 : null;

  if (trailingProbPct == null) return null;

  return t.rich("midtermsHubChamberTooltipBody", {
    party: trailingParty,
    count: seatsNeeded,
    chamber: chamberLabel,
    pct: trailingProbPct,
    b: (chunks) => <strong className="font-bold">{chunks}</strong>,
  });
}

type RowProps = {
  chamberLabel: string;
  demProb: number | null;
  repProb: number | null;
  currentDem: number;
  currentRep: number;
  sourcePost: PostWithForecasts | null;
  tooltipBody: ReactNode | null;
  tooltipDisclaimer: string;
  labels: Labels;
};

function ChamberRow({
  chamberLabel,
  demProb,
  repProb,
  currentDem,
  currentRep,
  sourcePost,
  tooltipBody,
  tooltipDisclaimer,
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

  const href = sourcePost ? `/questions/${sourcePost.id}` : undefined;

  const slash = (
    // 50% opacity separator shared by Forecast and Current rows.
    <span className="opacity-50">{" / "}</span>
  );

  const inner = (
    <>
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
          <CvBar
            fill
            color={MIDTERMS_COLORS.demPrimary}
            borderColor={MIDTERMS_COLORS.demBorder}
          />
          <CvBar
            fill
            color={MIDTERMS_COLORS.repPrimary}
            borderColor={MIDTERMS_COLORS.repBorder}
          />
        </div>
      )}
      <div className="mt-2 text-right text-sm tabular-nums text-blue-700 dark:text-blue-700-dark">
        <span className="mr-1">{labels.current}</span>
        <span style={{ color: MIDTERMS_COLORS.demPrimary }}>
          D {currentDem}
        </span>
        {slash}
        <span style={{ color: MIDTERMS_COLORS.repPrimary }}>
          R {currentRep}
        </span>
      </div>
    </>
  );

  const groupClass = cn(
    "group/cv block",
    href && "cursor-pointer no-underline"
  );

  const linkOrDiv = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={groupClass}
    >
      {inner}
    </a>
  ) : (
    <div className={groupClass}>{inner}</div>
  );

  if (!tooltipBody) return linkOrDiv;

  return (
    <ChamberRowTooltip
      body={tooltipBody}
      disclaimer={tooltipDisclaimer}
      href={href}
    >
      {linkOrDiv}
    </ChamberRowTooltip>
  );
}
