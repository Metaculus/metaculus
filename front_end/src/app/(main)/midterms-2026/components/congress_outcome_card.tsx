import { getTranslations } from "next-intl/server";

import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import { MIDTERMS_COLORS } from "../constants";
import CvBar, { GradientColorStop, ThemedColor } from "./cv_bar";
import { getMultipleChoiceOptionProbability } from "../helpers/post_utils";

type OutcomeKey = "RR" | "RD" | "DR" | "DD";

const OUTCOME_OPTION_LABEL: Record<OutcomeKey, string> = {
  RR: "Rep Senate / Rep House",
  RD: "Rep Senate / Dem House",
  DR: "Dem Senate / Rep House",
  DD: "Dem Senate / Dem House",
};

// Themed color tokens for the bars.
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

// Split outcomes (Rep Senate / Dem House and vice versa) use a horizontal
// gradient from the rep color (left) to the dem color (right) — including
// a matching gradient border — so neither party reads as the "owner" of
// the bar.
const SPLIT_GRADIENT: [GradientColorStop, GradientColorStop] = [
  { fill: REP_FILL, border: REP_BORDER },
  { fill: DEM_FILL, border: DEM_BORDER },
];

type Outcome = {
  key: OutcomeKey;
  pct: number | null;
} & (
  | { kind: "solid"; color: ThemedColor; borderColor: ThemedColor }
  | { kind: "gradient" }
);

type Props = {
  post: PostWithForecasts | null;
};

export default async function CongressOutcomeCard({ post }: Props) {
  const t = await getTranslations();

  const buildSolid = (
    key: OutcomeKey,
    color: ThemedColor,
    borderColor: ThemedColor
  ): Outcome => {
    const prob = getMultipleChoiceOptionProbability(
      post,
      OUTCOME_OPTION_LABEL[key]
    );
    return {
      key,
      pct: prob != null ? Math.round(prob * 1000) / 10 : null,
      kind: "solid",
      color,
      borderColor,
    };
  };

  const buildGradient = (key: OutcomeKey): Outcome => {
    const prob = getMultipleChoiceOptionProbability(
      post,
      OUTCOME_OPTION_LABEL[key]
    );
    return {
      key,
      pct: prob != null ? Math.round(prob * 1000) / 10 : null,
      kind: "gradient",
    };
  };

  const outcomes: Outcome[] = [
    buildSolid("RR", REP_FILL, REP_BORDER),
    buildGradient("RD"),
    buildGradient("DR"),
    buildSolid("DD", DEM_FILL, DEM_BORDER),
  ];

  const labels: Record<OutcomeKey, string> = {
    RR: t("midtermsHubOutcomeRepRep"),
    RD: t("midtermsHubOutcomeRepDem"),
    DR: t("midtermsHubOutcomeDemRep"),
    DD: t("midtermsHubOutcomeDemDem"),
  };

  const href = post ? `/questions/${post.id}` : undefined;

  return (
    <div className="rounded-md border border-blue-300 bg-blue-100 p-5 dark:border-blue-300-dark dark:bg-blue-100-dark">
      <h3 className="m-0 mb-5 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
        {t("midtermsHubCongressForecast")}
      </h3>
      <div className="space-y-3">
        {outcomes.map((o) => (
          <OutcomeRow
            key={o.key}
            outcome={o}
            label={labels[o.key]}
            href={href}
          />
        ))}
      </div>
    </div>
  );
}

function OutcomeRow({
  outcome,
  label,
  href,
}: {
  outcome: Outcome;
  label: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="block text-sm text-blue-800 dark:text-blue-800-dark">
        {label}
      </span>
      <div className="mt-1 flex items-center">
        {outcome.kind === "solid" ? (
          <CvBar
            pct={outcome.pct ?? 0}
            color={outcome.color}
            borderColor={outcome.borderColor}
          />
        ) : (
          <CvBar pct={outcome.pct ?? 0} gradientColors={SPLIT_GRADIENT} />
        )}
        <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums text-blue-800 dark:text-blue-800-dark">
          {outcome.pct != null ? `${outcome.pct.toFixed(1)}%` : "—"}
        </span>
      </div>
    </>
  );

  const className = cn(
    "group/cv block rounded-sm",
    href && "cursor-pointer no-underline"
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }
  return <div className={className}>{inner}</div>;
}
