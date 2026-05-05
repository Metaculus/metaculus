import { getTranslations } from "next-intl/server";

import { MIDTERMS_COLORS } from "../constants";
import { ChamberData } from "../helpers/fetch_dashboard_data";
import { getBinaryProbability } from "../helpers/post_utils";

const CURRENT_SENATE = { dem: 47, rep: 53 };
const CURRENT_HOUSE = { dem: 215, rep: 220 };
const SENATE_TOTAL = 100;
const HOUSE_TOTAL = 435;

type Props = {
  data: ChamberData;
};

export default async function ChamberControlCard({ data }: Props) {
  const t = await getTranslations();

  const senateDemProb = getBinaryProbability(data.senateControl);
  const houseDemProb = getBinaryProbability(data.houseControl);

  const senateDemNeeded = Math.floor(SENATE_TOTAL / 2) + 1 - CURRENT_SENATE.dem;
  const houseDemNeeded = Math.floor(HOUSE_TOTAL / 2) + 1 - CURRENT_HOUSE.dem;

  return (
    <div className="rounded-lg border border-gray-300 bg-gray-0 p-5 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <h3 className="m-0 mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
        {t("midtermsHubChamberControl")}
      </h3>
      <div className="space-y-4">
        <ChamberRow
          chamberLabel={t("midtermsHubChamberSenate")}
          demProb={senateDemProb}
          currentDem={CURRENT_SENATE.dem}
          currentRep={CURRENT_SENATE.rep}
          demNeeded={senateDemNeeded}
          demNeededLabel={t("midtermsHubDemsNeed", { count: senateDemNeeded })}
        />
        <ChamberRow
          chamberLabel={t("midtermsHubChamberHouse")}
          demProb={houseDemProb}
          currentDem={CURRENT_HOUSE.dem}
          currentRep={CURRENT_HOUSE.rep}
          demNeeded={houseDemNeeded}
          demNeededLabel={t("midtermsHubDemsNeed", { count: houseDemNeeded })}
        />
      </div>
    </div>
  );
}

type RowProps = {
  chamberLabel: string;
  demProb: number | null;
  currentDem: number;
  currentRep: number;
  demNeeded: number;
  demNeededLabel: string;
};

function ChamberRow({
  chamberLabel,
  demProb,
  currentDem,
  currentRep,
  demNeededLabel,
}: RowProps) {
  const demPct = demProb == null ? null : Math.round(demProb * 1000) / 10;
  const repPct = demPct == null ? null : Math.round((100 - demPct) * 10) / 10;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-800 dark:text-gray-800-dark">
          {chamberLabel}
        </span>
        {demPct != null && repPct != null && (
          <span className="text-xs text-gray-600 dark:text-gray-600-dark">
            <span style={{ color: MIDTERMS_COLORS.demPrimary }}>{demPct}%</span>
            {" / "}
            <span style={{ color: MIDTERMS_COLORS.repPrimary }}>{repPct}%</span>
          </span>
        )}
      </div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-200-dark">
        {demPct != null && (
          <>
            <div
              className="h-full"
              style={{
                width: `${demPct}%`,
                backgroundColor: MIDTERMS_COLORS.demPrimary,
              }}
            />
            <div
              className="h-full"
              style={{
                width: `${100 - demPct}%`,
                backgroundColor: MIDTERMS_COLORS.repPrimary,
              }}
            />
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-600-dark">
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
    </div>
  );
}
