import { getTranslations } from "next-intl/server";

import { MIDTERMS_COLORS } from "../constants";

type Props = {
  value: number;
  color?: string;
};

const RADIUS = 45;
const STROKE_WIDTH = 10;
const CIRCUMFERENCE = Math.PI * RADIUS;

export default async function SemicircleGauge({
  value,
  color = MIDTERMS_COLORS.repPrimary,
}: Props) {
  const t = await getTranslations();
  const fillLength = (value / 100) * CIRCUMFERENCE;

  return (
    <div className="relative h-20 w-32">
      <svg viewBox="0 0 120 70" className="h-full w-full" aria-hidden="true">
        <path
          d="M 15 60 A 45 45 0 0 1 105 60"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
        <path
          d="M 15 60 A 45 45 0 0 1 105 60"
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${fillLength} ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <span className="text-2xl font-bold" style={{ color }}>
          {value}%
        </span>
        <span className="text-[10px] uppercase text-gray-500 dark:text-gray-500-dark">
          {t("midtermsHubChance")}
        </span>
      </div>
    </div>
  );
}
