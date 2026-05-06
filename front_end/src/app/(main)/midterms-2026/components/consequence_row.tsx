import { getTranslations } from "next-intl/server";

import { MIDTERMS_COLORS } from "../constants";
import { ConsequenceRow as ConsequenceRowData } from "../data";
import CvBar from "./cv_bar";

type Props = {
  row: ConsequenceRowData;
};

export default async function ConsequenceRow({ row }: Props) {
  const t = await getTranslations();
  const question = (() => {
    switch (row.questionKey) {
      case "climate":
        return t("midtermsHubConsequenceClimate");
      case "minWage":
        return t("midtermsHubConsequenceMinWage");
      case "immigration":
        return t("midtermsHubConsequenceImmigration");
      case "shutdown":
        return t("midtermsHubConsequenceShutdown");
    }
  })();

  return (
    <div className="group/cv grid grid-cols-1 gap-3 border-b border-blue-300 py-4 last:border-0 dark:border-blue-300-dark md:grid-cols-[2fr_1fr_1fr] md:gap-4">
      <p className="m-0 text-sm font-medium text-blue-800 dark:text-blue-800-dark md:text-base">
        {question}
      </p>
      <ConsequenceBar
        pct={row.repCongressPct}
        color={MIDTERMS_COLORS.repPrimary}
        borderColor={MIDTERMS_COLORS.repBorder}
        mobileLabel={t("midtermsHubConsequenceIfRep")}
      />
      <ConsequenceBar
        pct={row.demCongressPct}
        color={MIDTERMS_COLORS.demPrimary}
        borderColor={MIDTERMS_COLORS.demBorder}
        mobileLabel={t("midtermsHubConsequenceIfDem")}
      />
    </div>
  );
}

function ConsequenceBar({
  pct,
  color,
  borderColor,
  mobileLabel,
}: {
  pct: number;
  color: string;
  borderColor: string;
  mobileLabel: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-600-dark md:hidden">
        {mobileLabel}
      </span>
      <div className="flex items-center">
        <CvBar pct={pct} color={color} borderColor={borderColor} />
        <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums text-blue-800 dark:text-blue-800-dark">
          {pct}%
        </span>
      </div>
    </div>
  );
}
