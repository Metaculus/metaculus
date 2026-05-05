import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import DistributionCurve from "../components/distribution_curve";
import SemicircleGauge from "../components/semicircle_gauge";
import { MIDTERMS_COLORS } from "../constants";
import { fetchChamberData } from "../helpers/fetch_dashboard_data";
import {
  getBinaryProbability,
  getForecastersCount,
  getNumericForecast,
} from "../helpers/post_utils";

const PLACEHOLDER_TURNOUT = 49.3;
const PLACEHOLDER_INTEGRITY = 9;

export default async function ThingsToWatchSection() {
  const t = await getTranslations();
  const chamber = await fetchChamberData();

  const turnoutValue =
    getNumericForecast(chamber.voterTurnout) ?? PLACEHOLDER_TURNOUT;
  const turnoutForecasters = getForecastersCount(chamber.voterTurnout);

  const integrityProb = getBinaryProbability(chamber.electionIntegrity);
  const integrityValue =
    integrityProb != null
      ? Math.round(integrityProb * 100)
      : PLACEHOLDER_INTEGRITY;
  const integrityForecasters = getForecastersCount(chamber.electionIntegrity);
  const integrityLink = chamber.electionIntegrity
    ? `/questions/${chamber.electionIntegrity.id}`
    : null;

  const integrityKeyFactors: string[] = [
    t("midtermsHubIntegrityFactor1"),
    t("midtermsHubIntegrityFactor2"),
    t("midtermsHubIntegrityFactor3"),
  ];

  return (
    <section className="pt-6">
      <div className="mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
          {t("midtermsHubThingsToWatch")}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="space-y-5 rounded-xl border border-gray-300 bg-gray-0 p-5 dark:border-gray-300-dark dark:bg-gray-0-dark">
          <header className="flex items-center justify-between">
            <h3 className="m-0 text-base font-semibold text-gray-900 dark:text-gray-900-dark">
              {t("midtermsHubVoterTurnout")}
            </h3>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-500-dark">
              <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5" />
              {t("midtermsHubForecastersCount", { count: turnoutForecasters })}
            </span>
          </header>
          <DistributionCurve value={Number(turnoutValue.toFixed(1))} />
          <p className="m-0 text-xs italic text-gray-600 dark:text-gray-600-dark">
            {t("midtermsHubTurnoutContext")}
          </p>
        </article>

        <article className="space-y-4 rounded-xl border border-gray-300 bg-gray-0 p-5 dark:border-gray-300-dark dark:bg-gray-0-dark">
          <header className="flex items-center justify-between">
            <h3 className="m-0 text-base font-semibold text-gray-900 dark:text-gray-900-dark">
              {t("midtermsHubElectionIntegrity")}
            </h3>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-500-dark">
              <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5" />
              {t("midtermsHubForecastersCount", {
                count: integrityForecasters,
              })}
            </span>
          </header>
          <div className="grid grid-cols-[auto_1fr] gap-6">
            <SemicircleGauge value={integrityValue} />
            <div className="space-y-3">
              <p className="m-0 text-sm font-medium leading-snug text-gray-900 dark:text-gray-900-dark">
                {t("midtermsHubIntegrityQuestion")}
              </p>
              <p className="m-0 text-[13px] leading-relaxed text-gray-600 dark:text-gray-600-dark">
                {t("midtermsHubIntegrityContext")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {integrityKeyFactors.map((factor, i) => (
              <span
                key={i}
                className="inline-block rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-gray-100-dark dark:text-gray-700-dark"
              >
                {factor}
              </span>
            ))}
          </div>
          {integrityLink && (
            <Link
              href={integrityLink}
              className="inline-block text-[13px] hover:underline"
              style={{ color: MIDTERMS_COLORS.demPrimary }}
            >
              {t("midtermsHubViewQuestion")} →
            </Link>
          )}
        </article>
      </div>
    </section>
  );
}
