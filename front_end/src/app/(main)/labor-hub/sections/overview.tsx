import { ComponentProps } from "react";

import { MultiLineRiskMonitor } from "../components/multi-line-risk-monitor";
import { RiskMonitor } from "../components/risk-monitor";

export function OverviewSection({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className="grid scroll-mt-12 items-start gap-5 sm:gap-6 md:grid-cols-2 md:gap-8"
      {...props}
    >
      {/* Left Column */}
      <div className="flex flex-col gap-5 sm:gap-6 md:gap-8">
        <RiskMonitor
          variant="primary"
          title="Risk Monitor"
          subtitle="Predicted employment change in the next decade"
        />
      </div>

      <MultiLineRiskMonitor
        title="Predicted employment change in the next decade"
        variant="primary"
      />
    </section>
  );
}
