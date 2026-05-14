import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

export default async function ChamberTabs({ className }: Props) {
  const t = await getTranslations();
  const tabs: { key: string; label: string; active: boolean }[] = [
    { key: "senate", label: t("midtermsHubChamberSenate"), active: true },
    { key: "governor", label: t("midtermsHubChamberGovernor"), active: false },
  ];

  return (
    <div
      className={cn(
        "inline-flex overflow-visible rounded-md border border-blue-300 bg-gray-0 dark:border-blue-300-dark dark:bg-gray-0-dark",
        className
      )}
    >
      {tabs.map((tab) =>
        tab.active ? (
          <button
            key={tab.key}
            type="button"
            aria-current="true"
            className="bg-blue-200 px-4 py-1.5 text-sm font-medium text-blue-800 transition-colors dark:bg-blue-200-dark dark:text-blue-800-dark"
          >
            {tab.label}
          </button>
        ) : (
          <span key={tab.key} className="group relative inline-block">
            <button
              type="button"
              disabled
              className="cursor-not-allowed bg-gray-0 px-4 py-1.5 text-sm font-medium text-blue-500 dark:bg-gray-0-dark dark:text-blue-500-dark"
            >
              {tab.label}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-blue-800 px-2 py-1 text-xs text-gray-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:bg-blue-800-dark dark:text-gray-0-dark"
            >
              {t("midtermsHubComingSoon")}
            </span>
          </span>
        )
      )}
    </div>
  );
}
