import { ComponentProps } from "react";

import MultiLineRiskChart from "../components/question-cards/multi-line-risk-chart";
import { QuestionCard } from "../components/question-cards/question-card";
import { RiskChart } from "../components/question-cards/risk-chart";

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
        <QuestionCard
          title="Risk Monitor"
          subtitle="Predicted employment change in the next decade"
          variant="primary"
        >
          <RiskChart />
        </QuestionCard>

        {/* Summary Text */}
        <div className="text-base text-blue-700 dark:text-blue-700-dark md:text-xl">
          Overall employment is projected to{" "}
          <span className="font-bold text-salmon-600 dark:text-salmon-600-dark">
            fall 3% by 2030
          </span>{" "}
          and{" "}
          <span className="font-bold text-salmon-600 dark:text-salmon-600-dark">
            7% by 2035
          </span>{" "}
          relative to 2025 due to AI-driven displacement. This sharply contrasts
          with{" "}
          <span className="font-bold">
            government baselines projecting +3% growth
          </span>{" "}
          over the decade from aging-adjusted population trends. The{" "}
          <span className="font-bold text-mc-option-2 dark:text-mc-option-2-dark">
            most vulnerable AI-exposed occupations
          </span>{" "}
          are expected to shrink{" "}
          <span className="font-bold text-mc-option-2 dark:text-mc-option-2-dark">
            67% by 2035
          </span>
          , while the{" "}
          <span className="font-bold text-mc-option-3 dark:text-mc-option-3-dark">
            least vulnerable occupations grow 19%
          </span>
          .
        </div>
      </div>

      <QuestionCard
        title="Predicted employment change in the next decade"
        variant="primary"
      >
        <MultiLineRiskChart />
      </QuestionCard>
    </section>
  );
}
