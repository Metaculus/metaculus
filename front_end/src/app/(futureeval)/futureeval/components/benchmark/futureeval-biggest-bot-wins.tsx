"use client";

import Link from "next/link";
import React, { useState } from "react";

import cn from "@/utils/core/cn";

import {
  BIGGEST_BOT_WINS_DATA,
  BotWinQuestion,
  CategoryData,
} from "../../data/biggest-bot-wins";
import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";

/**
 * Format percentage for display
 */
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

type ArcResult = {
  path: string;
  endPoint: { x: number; y: number };
  startPoint: { x: number; y: number };
};

function describeArc(
  percentage: number,
  arcAngle: number,
  center: { x: number; y: number },
  radius: number
): ArcResult {
  const startAngle = Math.PI - (arcAngle - Math.PI) / 2;
  const endAngle = startAngle + (percentage / 100) * arcAngle;
  const sweptAngle = (percentage / 100) * arcAngle;
  const isLargerFlag = sweptAngle > Math.PI ? 1 : 0;
  const startX = center.x + radius * Math.cos(startAngle);
  const startY = center.y + radius * Math.sin(startAngle);
  const endX = center.x + radius * Math.cos(endAngle);
  const endY = center.y + radius * Math.sin(endAngle);
  return {
    path: `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLargerFlag} 1 ${endX} ${endY}`,
    startPoint: { x: startX, y: startY },
    endPoint: { x: endX, y: endY },
  };
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
  const backgroundArc = describeArc(100, arcAngle, center, radius);
  const progressArc =
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
            d={backgroundArc.path}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-futureeval-primary-light dark:stroke-futureeval-primary-dark"
          />
          {progressArc && (
            <path
              d={progressArc.path}
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
            "absolute inset-0 flex items-end justify-center pb-2 text-center",
            FE_COLORS.textHeading
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
 * Colored pill badge showing Yes/No resolution outcome.
 */
const ResolutionBadge: React.FC<{ resolved: boolean }> = ({ resolved }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
      resolved
        ? "bg-green-500/15 text-green-500 dark:bg-green-400/15 dark:text-green-400"
        : "bg-red-500/15 text-red-500 dark:bg-red-400/15 dark:text-red-400"
    )}
  >
    {resolved ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M3 7.5L5.5 10L11 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M4 4L10 10M10 4L4 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
    {resolved ? "Yes" : "No"}
  </span>
);

/**
 * Category tab selector (Bot wins / Bot losses)
 */
const CategoryTabs: React.FC<{
  categories: CategoryData[];
  activeId: string;
  onSelect: (id: string) => void;
}> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="mb-6 flex gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeId === category.id
              ? "bg-futureeval-primary-light text-futureeval-bg-light dark:bg-futureeval-primary-dark dark:text-futureeval-bg-dark"
              : "bg-futureeval-bg-dark/5 text-futureeval-bg-dark/80 hover:bg-futureeval-bg-dark/10 dark:bg-futureeval-bg-light/5 dark:text-futureeval-bg-light/80 dark:hover:bg-futureeval-bg-light/10"
          )}
        >
          {category.label}
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
 * Inline quote block with a link to the original comment
 */
const QuoteBlock: React.FC<{
  label: string;
  text: string;
  author: string;
  commentUrl: string;
}> = ({ label, text, author, commentUrl }) => (
  <div className="mb-1.5 last:mb-0">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500-dark">
      {label}
    </span>
    <Link
      href={commentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-0.5 block text-xs italic text-gray-600 underline decoration-gray-400/40 underline-offset-2 transition-colors hover:text-futureeval-primary-light hover:decoration-futureeval-primary-light dark:text-gray-400 dark:decoration-gray-600/40 dark:hover:text-futureeval-primary-dark dark:hover:decoration-futureeval-primary-dark"
    >
      &ldquo;{text}&rdquo;
      <span className="ml-1 not-italic text-gray-500 dark:text-gray-500-dark">
        — {author}
      </span>
    </Link>
  </div>
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
          <col className="w-[25%] min-w-[180px] max-w-[350px]" />
          <col className="w-[9%] min-w-[75px]" />
          <col className="w-[9%] min-w-[75px]" />
          <col className="w-[8%] min-w-[80px]" />
          <col className="w-[25%] min-w-[140px]" />
          <col className="w-[24%] min-w-[180px]" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-300 bg-futureeval-bg-light dark:border-gray-300-dark dark:bg-futureeval-bg-dark">
            <Th>Question</Th>
            <Th className="text-center">Pros Forecast</Th>
            <Th className="text-center">Bots Forecast</Th>
            <Th className="text-center">Did it happen?</Th>
            <Th>What happened</Th>
            <Th>Quotes</Th>
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
              <Td className="text-center align-middle">
                <ResolutionBadge resolved={q.didItHappen} />
              </Td>
              <Td>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  {q.whatHappened}
                </div>
              </Td>
              <Td>
                <QuoteBlock
                  label="Bot"
                  text={q.botQuote.text}
                  author={q.botQuote.author}
                  commentUrl={q.botQuote.commentUrl}
                />
                <QuoteBlock
                  label="Pro"
                  text={q.proQuote.text}
                  author={q.proQuote.author}
                  commentUrl={q.proQuote.commentUrl}
                />
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
          <div className="mb-3 flex flex-col items-center">
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
              Did it happen?
            </div>
            <ResolutionBadge resolved={q.didItHappen} />
          </div>

          {/* What happened */}
          <div className="mb-3">
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
              What happened
            </div>
            <p className="m-0 text-sm text-gray-600 dark:text-gray-400">
              {q.whatHappened}
            </p>
          </div>

          {/* Quotes */}
          <div>
            <div className="mb-1 text-xs text-gray-500 dark:text-gray-500-dark">
              Quotes
            </div>
            <QuoteBlock
              label="Bot"
              text={q.botQuote.text}
              author={q.botQuote.author}
              commentUrl={q.botQuote.commentUrl}
            />
            <QuoteBlock
              label="Pro"
              text={q.proQuote.text}
              author={q.proQuote.author}
              commentUrl={q.proQuote.commentUrl}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Main component for Biggest Bot Wins/Losses section
 */
const FutureEvalBiggestBotWins: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(
    BIGGEST_BOT_WINS_DATA[0]?.id ?? ""
  );

  const activeData = BIGGEST_BOT_WINS_DATA.find(
    (c) => c.id === activeCategory
  );
  const questions = activeData?.questions ?? [];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <h3 className={cn("m-0", FE_TYPOGRAPHY.h2, FE_COLORS.textHeading)}>
        Biggest Bot Wins/Losses
      </h3>
      <p
        className={cn(
          "m-0 mb-4 mt-3",
          FE_TYPOGRAPHY.body,
          FE_COLORS.textSubheading
        )}
      >
        Questions where bots significantly outperformed pro forecasters, and
        vice versa.
      </p>

      {/* Tabs */}
      <CategoryTabs
        categories={BIGGEST_BOT_WINS_DATA}
        activeId={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Table (Desktop) / Cards (Mobile) */}
      <DesktopTable questions={questions} />
      <MobileCards questions={questions} />
    </div>
  );
};

export default FutureEvalBiggestBotWins;
