import { ReactNode } from "react";

type Props = {
  insights: ReactNode;
  dataRail: ReactNode;
};

/**
 * Below the Jump-To strip.
 * - Mobile: data rail first (Wage tile if any + exposure tiles 3-across),
 *   then Curated Insights — all in one container.
 * - Desktop: Curated Insights (2/3) left, data rail (1/3) right.
 */
export function BentoLayout({ insights, dataRail }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:order-1 md:col-span-2">{insights}</div>
      <div className="md:order-2 md:col-span-1">{dataRail}</div>
    </div>
  );
}
