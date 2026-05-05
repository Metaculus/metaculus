import { getTranslations } from "next-intl/server";

import { MIDTERMS_COLORS } from "../constants";
import { ConsequenceRow as ConsequenceRowData } from "../data";

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
    <div className="grid grid-cols-1 gap-4 border-b border-gray-200 py-4 last:border-0 dark:border-gray-200-dark md:grid-cols-[2fr_1fr_1fr]">
      <p className="m-0 text-sm font-medium text-gray-800 dark:text-gray-800-dark">
        {question}
      </p>
      <ConsequenceBar
        pct={row.repCongressPct}
        color={MIDTERMS_COLORS.repPrimary}
        bg={MIDTERMS_COLORS.repLight}
      />
      <ConsequenceBar
        pct={row.demCongressPct}
        color={MIDTERMS_COLORS.demPrimary}
        bg={MIDTERMS_COLORS.demLight}
      />
    </div>
  );
}

function ConsequenceBar({
  pct,
  color,
  bg,
}: {
  pct: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div
          className="h-5 rounded-sm"
          style={{
            width: `${pct}%`,
            backgroundColor: bg,
            borderLeft: `3px solid ${color}`,
          }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-gray-800 dark:text-gray-800-dark">
        {pct}%
      </span>
    </div>
  );
}
