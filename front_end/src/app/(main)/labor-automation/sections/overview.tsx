import { ComponentProps } from "react";

export function OverviewSection({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className="grid scroll-mt-12 gap-5 sm:gap-6 md:grid-cols-2 md:gap-8"
      {...props}
    >
      {/* Left Column */}
      <div className="flex flex-col gap-5 sm:gap-6 md:gap-8">
        {/* Mini Line Chart */}
        <div className="h-48 w-full rounded-lg bg-gray-100 dark:bg-gray-100-dark"></div>

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

      <div className="h-48 w-full rounded-lg bg-gray-100 dark:bg-gray-100-dark"></div>
    </section>
  );
}
