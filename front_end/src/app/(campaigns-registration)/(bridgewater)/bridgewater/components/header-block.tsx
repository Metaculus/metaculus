import Image from "next/image";
import { FC } from "react";

import { BRIDGEWATER_2026 } from "../constants";

/**
 * Header block with hero image and Metaculus logo overlay
 * Modeled after tournament page header structure
 */
const HeaderBlock: FC = () => {
  return (
    <div className="rounded-b-md bg-gray-0 dark:bg-gray-0-dark sm:rounded-md">
      {/* Hero Image with Logo Overlay */}
      <div className="relative h-[100px] w-full overflow-hidden rounded-t-md sm:h-[130px]">
        <Image
          src="https://cdn.metaculus.com/bw-cover2x.webp"
          alt="Bridgewater Contest"
          fill
          priority
          className="size-full object-cover object-center"
          unoptimized
        />
      </div>

      {/* Content Section */}
      <div className="px-4 pb-5 pt-4 sm:p-8">
        {/* Title */}
        <h1 className="m-0 mb-6 text-balance text-center text-2xl font-bold text-blue-800 dark:text-blue-800-dark sm:text-3xl md:text-4xl">
          {BRIDGEWATER_2026.title}
        </h1>

        {/* Info Cards Row */}
        <div className="flex w-full flex-col justify-stretch gap-0.5 sm:flex-row sm:gap-6">
          <InfoCard label="START DATE" value={BRIDGEWATER_2026.startDate} />
          <InfoCard label="END DATE" value={BRIDGEWATER_2026.endDate} />
          <InfoCard
            label="PRIZE POOL"
            value={BRIDGEWATER_2026.prizePool}
            highlight
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Info card component for displaying tournament stats
 */
const InfoCard: FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight = false }) => {
  return (
    <div
      className={`flex w-full flex-row items-center justify-between rounded px-2 py-1.5 sm:w-1/3 sm:flex-col sm:px-6 sm:py-4 ${
        highlight
          ? "bg-olive-300 dark:bg-olive-300-dark"
          : "bg-gray-200 dark:bg-gray-200-dark"
      }`}
    >
      <span
        className={`text-xs font-medium uppercase ${
          highlight
            ? "text-olive-900 dark:text-olive-900-dark"
            : "text-gray-800 dark:text-gray-800-dark"
        }`}
      >
        {label}
      </span>
      <span
        className={`mt-0 text-sm font-medium sm:mt-1 sm:text-lg ${
          highlight
            ? "text-olive-900 dark:text-olive-900-dark"
            : "text-gray-800 dark:text-gray-800-dark"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default HeaderBlock;
