"use client";

import { ReactNode, useState } from "react";

import ButtonGroup from "@/components/ui/button_group";

import { useLaborHubChartHover } from "./labor_hub_chart_hover_context";

type OverviewTab = "overall" | "vulnerability";

type OverviewMobileCardTabsProps = {
  tabs: {
    id: OverviewTab;
    label: string;
    content: ReactNode;
  }[];
};

export function OverviewMobileCardTabs({ tabs }: OverviewMobileCardTabsProps) {
  const [activeTab, setActiveTab] = useState<OverviewTab>(
    tabs[0]?.id ?? "overall"
  );
  const hoverContext = useLaborHubChartHover();
  const activeContent =
    tabs.find((tab) => tab.id === activeTab)?.content ??
    tabs[0]?.content ??
    null;

  return (
    <div className="space-y-4 lg:hidden print:hidden">
      <ButtonGroup
        value={activeTab}
        buttons={tabs.map((tab) => ({
          value: tab.id,
          label: tab.label,
        }))}
        onChange={(value) => {
          setActiveTab(value);
          hoverContext?.setHoverYear(null);
          hoverContext?.setHighlightedEnvelope(null);
        }}
        variant="tertiary"
        activeVariant="primary"
        containerClassName="w-full"
        className="min-w-0 flex-1 justify-center"
        activeClassName="min-w-0 flex-1 justify-center"
      />
      <div key={activeTab}>{activeContent}</div>
    </div>
  );
}
