"use client";

import Link from "next/link";
import React, { useState } from "react";

import cn from "@/utils/core/cn";

import {
  BIGGEST_BOT_WINS_DATA,
  BotWinQuestion,
  QuarterData,
} from "../../data/biggest-bot-wins";
import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";

/**
 * Format percentage for display
 */
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

function describeArc(
  percentage: number,
  arcAngle: number,
  center: { x: number; y: number },
  radius: number
): string {
  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const endAngle = startAngle + (percentage / 100) * arcAngle;
  const isLargerFlag = percentage > 50 ? 1 : 0;
  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLargerFlag} 1 ${endX} ${endY}`;
}

/**
 * Compact semi-circular forecast dial. Matches FutureEval aesthetic.
 * Use inside Td for table or in a flex container for cards.
 */
const ForecastDial: React.FC<{
  value: number;
  url: string;
  className?: string;
  size?: "sm" | "md";
}> = ({ value, url, className, size = "md" }) => {
  const scale = size === "sm" ? 0.85 : 1;
  const width = 88;
  const height = 54;
  const strokeWidth = 7;
  const radius = (width - strokeWidth) / 2;
  const arcAngle = Math.PI * 1.05;
  const center = { x: width / 2, y: height - strokeWidth / 2 };
  const percent = value * 100;
  const backgroundPath = describeArc(100, arcAngle, center, radius);
  const progressPath =
    percent > 0 ? describeArc(percent, arcAngle, center, radius) : null;

  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex cursor-pointer flex-col items-center rounded-md transition-opacity hover:opacity-90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-futureeval-primary-light focus-visible:ring-offset-2 dark:focus-visible:ring-futureeval-primary-dark dark:focus-visible:ring-offset-futureeval-bg-dark",
        "text-futureeval-primary-light dark:text-futureeval-primary-dark",
        className
      )}
    >
      <div
        className="relative flex origin-top items-center justify-center"
        style={{ transform: `scale(${scale})` }}
      >
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          aria-hidden
        >
          <path
            d={backgroundPath}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-futureeval-primary-light dark:stroke-futureeval-primary-dark"
          />
          {progressPath && (
            <path
              d={progressPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="stroke-futureeval-primary-light dark:stroke-futureeval-primary-dark"
            />
          )}
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-end justify-center pb-2 text-center text-gray-800 dark:text-gray-800-dark"
          )}
        >
          <span className="text-sm font-bold tabular-nums leading-none underline underline-offset-2">
            {formatPercent(value)}
          </span>
        </div>
      </div>
    </Link>
  );
};

/**
 * Quarter tab selector
 */
const QuarterTabs: React.FC<{
  quarters: QuarterData[];
  activeId: string;
  onSelect: (id: string) => void;
}> = ({ quarters, activeId, onSelect }) => {
  return (
    <div className="mb-6 flex gap-2">
      {quarters.map((quarter) => (
        <button
          key={quarter.id}
          onClick={() => onSelect(quarter.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeId === quarter.id
              ? "bg-futureeval-primary-light text-futureeval-bg-light dark:bg-futureeval-primary-dark dark:text-futureeval-bg-dark"
              : "bg-futureeval-bg-dark/5 text-futureeval-bg-dark/80 hover:bg-futureeval-bg-dark/10 dark:bg-futureeval-bg-light/5 dark:text-futureeval-bg-light/80 dark:hover:bg-futureeval-bg-light/10"
          )}
        >
          {quarter.label}
        </button>
      ))}
    </div>
  );
};

/**
 * Table header cell
 */
const Th: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
}) => (
  <th
    className={cn(
      "px-2 py-4 text-left text-xs font-bold leading-tight text-gray-500 antialiased dark:text-gray-500-dark lg:px-3 lg:text-sm",
      className
    )}
  >
    {children}
  </th>
);

/**
 * Table data cell
 */
const Td: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
}) => (
  <td
    className={cn(
      "px-2 py-4 text-sm leading-[20px] text-gray-800 dark:text-gray-800-dark lg:px-3",
      className
    )}
  >
    {children}
  </td>
);


/**
 * Desktop table view
 */
const DesktopTable: React.FC<{ questions: BotWinQuestion[] }> = ({
  questions,
}) => {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse border-spacing-0 border border-gray-300 dark:border-gray-300-dark">
        <colgroup>
          <col className="w-[35%] min-w-[200px] max-w-[400px]" />
          <col className="w-[10%] min-w-[75px]" />
          <col className="w-[10%] min-w-[75px]" />
          <col className="w-[10%] min-w-[80px]" />
          <col className="w-[35%] min-w-[140px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-300 bg-futureeval-bg-light dark:border-gray-300-dark dark:bg-futureeval-bg-dark">
            <Th>Question</Th>
            <Th className="text-center">Pros Forecast</Th>
            <Th className="text-center">Bots Forecast</Th>
            <Th className="text-center">Did it happen?</Th>
            <Th>What happened</Th>
          </tr>
        </thead>
        <tbody className="bg-futureeval-bg-light dark:bg-futureeval-bg-dark">
          {questions.map((q, i) => (
            <tr
              key={i}
              className="border-b border-gray-300 last:border-0 dark:border-gray-300-dark"
            >
              <Td className="max-w-0">
                <div className="line-clamp-3 text-balance font-medium">
                  {q.questionTitle}
                </div>
              </Td>
              <Td className="text-center align-middle">
                <ForecastDial value={q.prosForecast} url={q.prosUrl} />
              </Td>
              <Td className="text-center align-middle">
                <ForecastDial value={q.botsForecast} url={q.botsUrl} />
              </Td>
              <Td className="text-center">
                <span
                  className={cn(
                    "font-medium",
                    q.didItHappen
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {q.didItHappen ? "Yes" : "No"}
                </span>
              </Td>
              <Td>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  {q.whatHappened}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Mobile card view - displays each question as a card
 */
const MobileCards: React.FC<{ questions: BotWinQuestion[] }> = ({
  questions,
}) => {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {questions.map((q, i) => (
        <div
          key={i}
          className={cn(
            "rounded-lg border p-4",
            "border-gray-300 bg-futureeval-bg-light dark:border-gray-300-dark dark:bg-futureeval-bg-dark"
          )}
        >
          {/* Question Title */}
          <p
            className={cn(
              "m-0 mb-4 text-balance text-sm font-medium leading-snug",
              FE_COLORS.textHeading
            )}
          >
            {q.questionTitle}
          </p>

          {/* Forecasts Row */}
          <div className="mb-3 flex gap-4">
            <div className="flex flex-1 flex-col items-center">
              <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
                Pros forecast
              </div>
              <ForecastDial
                value={q.prosForecast}
                url={q.prosUrl}
                size="sm"
              />
            </div>
            <div className="flex flex-1 flex-col items-center">
              <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
                Bots forecast
              </div>
              <ForecastDial
                value={q.botsForecast}
                url={q.botsUrl}
                size="sm"
              />
            </div>
          </div>

          {/* Outcome Row */}
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
              Did it happen?
            </div>
            <span
              className={cn(
                "text-base font-medium",
                q.didItHappen
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {q.didItHappen ? "Yes" : "No"}
            </span>
          </div>

          {/* What happened */}
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
              What happened
            </div>
            <p className="m-0 text-sm text-gray-600 dark:text-gray-400">
              {q.whatHappened}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Main component for Biggest Bot Wins section
 */
const FutureEvalBiggestBotWins: React.FC = () => {
  const [activeQuarter, setActiveQuarter] = useState(
    BIGGEST_BOT_WINS_DATA[0]?.id ?? ""
  );

  const activeData = BIGGEST_BOT_WINS_DATA.find((q) => q.id === activeQuarter);
  // Sort questions by botsWonBy from highest to lowest
  const questions = [...(activeData?.questions ?? [])].sort(
    (a, b) => b.botsWonBy - a.botsWonBy
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <h3 className={cn("m-0", FE_TYPOGRAPHY.h2, FE_COLORS.textHeading)}>
        Biggest Bot Wins
      </h3>
      <p
        className={cn(
          "m-0 mb-4 mt-3",
          FE_TYPOGRAPHY.body,
          FE_COLORS.textSubheading
        )}
      >
        Questions where bots significantly outperformed pro forecasters.
      </p>

      {/* Tabs */}
      <QuarterTabs
        quarters={BIGGEST_BOT_WINS_DATA}
        activeId={activeQuarter}
        onSelect={setActiveQuarter}
      />

      {/* Table (Desktop) / Cards (Mobile) */}
      <DesktopTable questions={questions} />
      <MobileCards questions={questions} />
    </div>
  );
};

export default FutureEvalBiggestBotWins;
