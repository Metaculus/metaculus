import { getTranslations } from "next-intl/server";

import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

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

  const senateDemNeeded = Math.floor(SENATE_TOTAL / 2) + 1 - CURRENT_SENATE.dem;
  const houseDemNeeded = Math.floor(HOUSE_TOTAL / 2) + 1 - CURRENT_HOUSE.dem;

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-5 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <h3 className="m-0 mb-5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
        {t("midtermsHubChamberControl")}
      </h3>
      <div className="space-y-5">
        <ChamberRow
          chamberLabel={t("midtermsHubChamberSenate")}
          demProb={senateDemProb}
          repProb={senateRepProb}
          currentDem={CURRENT_SENATE.dem}
          currentRep={CURRENT_SENATE.rep}
          demNeededLabel={t("midtermsHubDemsNeed", { count: senateDemNeeded })}
          sourcePost={data.senateControl}
        />
        <ChamberRow
          chamberLabel={t("midtermsHubChamberHouse")}
          demProb={houseDemProb}
          repProb={houseRepProb}
          currentDem={CURRENT_HOUSE.dem}
          currentRep={CURRENT_HOUSE.rep}
          demNeededLabel={t("midtermsHubDemsNeed", { count: houseDemNeeded })}
          sourcePost={data.houseControl}
        />
      </div>
    </div>
  );
}

type RowProps = {
  chamberLabel: string;
  demProb: number | null;
  repProb: number | null;
  currentDem: number;
  currentRep: number;
  demNeededLabel: string;
  sourcePost: PostWithForecasts | null;
};

function ChamberRow({
  chamberLabel,
  demProb,
  repProb,
  currentDem,
  currentRep,
  demNeededLabel,
  sourcePost,
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

  const inner = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-semibold text-blue-800 dark:text-blue-800-dark">
          {chamberLabel}
        </span>
        {demPct != null && repPct != null && (
          <span className="text-sm tabular-nums">
            <span style={{ color: MIDTERMS_COLORS.demPrimary }}>{demPct}%</span>
            <span className="text-blue-700 dark:text-blue-700-dark">
              {" / "}
            </span>
            <span style={{ color: MIDTERMS_COLORS.repPrimary }}>{repPct}%</span>
          </span>
        )}
      </div>
      <div className="flex w-full items-center gap-1">
        {demShare != null && repShare != null && (
          <>
            <CvBar
              pct={demShare}
              color={MIDTERMS_COLORS.demPrimary}
              borderColor={MIDTERMS_COLORS.demBorder}
              heightClassName="h-3"
            />
            <CvBar
              pct={repShare}
              color={MIDTERMS_COLORS.repPrimary}
              borderColor={MIDTERMS_COLORS.repBorder}
              heightClassName="h-3"
            />
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-sm tabular-nums text-blue-700 dark:text-blue-700-dark">
        <span>
          <span style={{ color: MIDTERMS_COLORS.repPrimary }}>
            R {currentRep}
          </span>
          {" — "}
          <span style={{ color: MIDTERMS_COLORS.demPrimary }}>
            D {currentDem}
          </span>
        </span>
        <span>{demNeededLabel}</span>
      </div>
    </>
  );

  const groupClass = cn(
    "group/cv block",
    href && "cursor-pointer no-underline"
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={groupClass}
      >
        {inner}
      </a>
    );
  }
  return <div className={groupClass}>{inner}</div>;
}
