import { getTranslations } from "next-intl/server";

import cn from "@/utils/core/cn";

export default async function ChamberTabs() {
  const t = await getTranslations();
  const tabs: { key: string; label: string; active: boolean }[] = [
    { key: "senate", label: t("midtermsHubChamberSenate"), active: true },
    { key: "house", label: t("midtermsHubChamberHouse"), active: false },
    { key: "governor", label: t("midtermsHubChamberGovernor"), active: false },
  ];

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-300-dark">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          disabled={!tab.active}
          aria-current={tab.active ? "true" : undefined}
          className={cn(
            "px-4 py-1.5 text-sm font-medium",
            tab.active
              ? "bg-gray-0 text-gray-900 dark:bg-gray-0-dark dark:text-gray-900-dark"
              : "cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-100-dark dark:text-gray-400-dark"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
