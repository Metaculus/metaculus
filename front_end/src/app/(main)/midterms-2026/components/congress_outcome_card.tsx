import { getTranslations } from "next-intl/server";

import { PostWithForecasts } from "@/types/post";

import { MIDTERMS_COLORS } from "../constants";
import { getMultipleChoiceOptionProbability } from "../helpers/post_utils";

type OutcomeKey = "RR" | "RD" | "DR" | "DD";

const OUTCOME_OPTION_LABEL: Record<OutcomeKey, string> = {
  RR: "Rep Senate / Rep House",
  RD: "Rep Senate / Dem House",
  DR: "Dem Senate / Rep House",
  DD: "Dem Senate / Dem House",
};

type Outcome = {
  key: OutcomeKey;
  pct: number | null;
  borderColor: string;
  bgColor: string;
};

type Props = {
  post: PostWithForecasts | null;
};

export default async function CongressOutcomeCard({ post }: Props) {
  const t = await getTranslations();

  const buildOutcome = (
    key: OutcomeKey,
    borderColor: string,
    bgColor: string
  ): Outcome => {
    const prob = getMultipleChoiceOptionProbability(
      post,
      OUTCOME_OPTION_LABEL[key]
    );
    return {
      key,
      pct: prob != null ? Math.round(prob * 1000) / 10 : null,
      borderColor,
      bgColor,
    };
  };

  const outcomes: Outcome[] = [
    buildOutcome("RR", MIDTERMS_COLORS.repPrimary, MIDTERMS_COLORS.repLight),
    buildOutcome("RD", MIDTERMS_COLORS.repPrimary, MIDTERMS_COLORS.repLight),
    buildOutcome("DR", MIDTERMS_COLORS.demPrimary, MIDTERMS_COLORS.demLight),
    buildOutcome("DD", MIDTERMS_COLORS.demPrimary, MIDTERMS_COLORS.demLight),
  ];

  const labels: Record<OutcomeKey, string> = {
    RR: t("midtermsHubOutcomeRepRep"),
    RD: t("midtermsHubOutcomeRepDem"),
    DR: t("midtermsHubOutcomeDemRep"),
    DD: t("midtermsHubOutcomeDemDem"),
  };

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-5 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <h3 className="m-0 mb-5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
        {t("midtermsHubCongressForecast")}
      </h3>
      <div className="space-y-2.5">
        {outcomes.map((o) => (
          <div
            key={o.key}
            className="grid grid-cols-[8rem_1fr] items-center gap-3"
          >
            <span className="text-sm text-blue-800 dark:text-blue-800-dark">
              {labels[o.key]}
            </span>
            <div className="flex items-center">
              <div
                className="h-5 rounded-sm"
                style={{
                  width: `${Math.max(o.pct ?? 0, 1)}%`,
                  backgroundColor: o.bgColor,
                  borderLeft: `3px solid ${o.borderColor}`,
                }}
              />
              <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums text-blue-800 dark:text-blue-800-dark">
                {o.pct != null ? `${o.pct.toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm leading-relaxed text-blue-700 dark:text-blue-700-dark">
        {t("midtermsHubCongressSummary")}
      </p>
    </div>
  );
}
