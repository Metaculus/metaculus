"use client";

import { FloatingPortal } from "@floating-ui/react";
import { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LightDarkIcon } from "@/app/(main)/aib/components/aib/light-dark-icon";
import cn from "@/utils/core/cn";

type Props = {
  heightPct: number;
  model: {
    id: string;
    name: string;
    score: number;
    contributionCount: number;
    iconLight?: StaticImageData | string;
    iconDark?: StaticImageData | string;
    isAggregate?: boolean;
  };
};

const FutureEvalModelBar: React.FC<Props> = ({ heightPct, model }) => {
  const t = useTranslations();
  const router = useRouter();
  const score = Math.round(model.score * 100) / 100;
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleClick = () => {
    router.push(
      `/futureeval/leaderboard?highlight=${encodeURIComponent(model.id)}`
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        className="flex h-full cursor-pointer flex-col items-center pb-28 pt-5 sm:pt-6"
        onClick={handleClick}
      >
        {/* Bar area - flex-1 takes remaining height, aligns bar at bottom */}
        <div className="relative flex w-full flex-1 flex-col items-center justify-end">
          {/* Score label - sits above the bar */}
          <span className="mb-1 shrink-0 text-[10px] font-medium tabular-nums text-gray-800 dark:text-gray-800-dark sm:text-xs">
            {score}
          </span>

          {/* The actual bar with 1px border - hover states and tooltip trigger */}
          <div
            className={cn(
              "relative flex w-full flex-col items-center rounded-t-md border pt-2 transition-all duration-200",
              model.isAggregate
                ? "border-violet-800 bg-violet-200 hover:bg-violet-300 dark:border-violet-800-dark dark:bg-violet-800-dark dark:hover:bg-violet-700-dark"
                : "border-gray-800 bg-gray-0 hover:bg-gray-300 dark:border-gray-800-dark dark:bg-gray-0-dark dark:hover:bg-gray-300-dark"
            )}
            style={{ height: `${heightPct}%`, minHeight: "48px" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
          >
            {/* Model icon at the TOP of the bar */}
            {(model.iconLight || model.iconDark) && (
              <LightDarkIcon
                alt={model.name}
                light={model.iconLight}
                dark={model.iconDark}
                sizePx="20px"
                className="shrink-0 sm:!h-6 sm:!w-6"
              />
            )}
          </div>

          {/* Small baseline at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-800 dark:bg-gray-800-dark" />
        </div>

        {/* Model name below bar - rotated 45 degrees with connecting line */}
        <div className="relative h-0 w-full">
          {/* Connecting line - centered */}
          <div className="absolute left-1/2 h-2 w-px -translate-x-1/2 bg-gray-800 dark:bg-gray-800-dark" />
          {/* Rotated label - starts at end of line */}
          <span
            className="absolute left-1/2 top-2 ml-[3px] line-clamp-1 w-[140px] origin-top-left rotate-45 text-xs font-medium text-gray-800 dark:text-gray-800-dark sm:top-3 sm:line-clamp-2 sm:w-[140px] sm:text-sm sm:leading-4"
            title={model.name}
          >
            {model.name}
          </span>
        </div>
      </div>

      {/* Cursor-following tooltip */}
      {isHovered && (
        <FloatingPortal>
          <div
            className="pointer-events-none z-100 rounded border border-gray-800 bg-gray-0 p-3 dark:border-gray-800-dark dark:bg-gray-0-dark"
            style={{
              position: "fixed",
              left: mousePos.x + 12,
              top: mousePos.y + 12,
            }}
          >
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[10px] text-gray-800 dark:text-gray-800-dark sm:text-xs">
                  {t("aibScore")}:
                </span>
                <span className="text-[10px] font-medium tabular-nums text-gray-800 dark:text-gray-800-dark sm:text-xs">
                  {score}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[10px] text-gray-800 dark:text-gray-800-dark sm:text-xs">
                  {t("aibLbThForecasts")}:
                </span>
                <span className="text-[10px] font-medium tabular-nums text-gray-800 dark:text-gray-800-dark sm:text-xs">
                  {model.contributionCount}
                </span>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};

export default FutureEvalModelBar;
