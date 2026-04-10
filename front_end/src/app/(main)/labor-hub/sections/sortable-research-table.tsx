"use client";

import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CSSProperties, FC, useMemo, useState } from "react";

import cn from "@/utils/core/cn";

import {
  TableCompact,
  TableCompactHead,
  TableCompactRow,
  TableCompactHeaderCell,
  TableCompactBody,
  TableCompactCell,
  PercentageChange,
} from "../components/table-compact";

type SortKey = { type: "year"; index: number } | { type: "rating" };
type SortDirection = "asc" | "desc";

export type ResearchTableRow = {
  name: string;
  values: (number | null)[];
  rating: number;
};

type PosNegColumnRanges = {
  /** Most negative value in the column (strongest red anchor). */
  negMin: number;
  /** Least negative (closest to 0) among negatives (weakest red anchor). */
  negMax: number;
  hasNeg: boolean;
  /** Smallest positive in the column (weakest green anchor). */
  posMin: number;
  /** Largest positive (strongest green anchor). */
  posMax: number;
  hasPos: boolean;
};

const EMPTY_POS_NEG_RANGE: PosNegColumnRanges = {
  negMin: 0,
  negMax: 0,
  hasNeg: false,
  posMin: 0,
  posMax: 0,
  hasPos: false,
};

function getColumnPosNegRanges(
  values: (number | null | undefined)[]
): PosNegColumnRanges {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  );
  const negs = nums.filter((v) => v < 0);
  const pos = nums.filter((v) => v > 0);
  const hasNeg = negs.length > 0;
  const hasPos = pos.length > 0;
  return {
    negMin: hasNeg ? Math.min(...negs) : 0,
    negMax: hasNeg ? Math.max(...negs) : 0,
    hasNeg,
    posMin: hasPos ? Math.min(...pos) : 0,
    posMax: hasPos ? Math.max(...pos) : 0,
    hasPos,
  };
}

function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

/** Negatives only: column min (most negative) → ratio 1 (most red); column max among negatives → ratio 0. */
function negativeIntensityRatio(value: number, r: PosNegColumnRanges): number {
  if (!r.hasNeg || value >= 0) return 0;
  if (r.negMin === r.negMax) return 1;
  return clamp01((value - r.negMax) / (r.negMin - r.negMax));
}

/** Positives only: column min positive → ratio 0 (palest green); column max → ratio 1 (strongest green). */
function positiveIntensityRatio(value: number, r: PosNegColumnRanges): number {
  if (!r.hasPos || value <= 0) return 0;
  if (r.posMin === r.posMax) return 1;
  return clamp01((value - r.posMin) / (r.posMax - r.posMin));
}

function getCellBackgroundStyle(
  value: number,
  range: PosNegColumnRanges,
  invertColors = false
): CSSProperties {
  if (value === 0) return {};

  let ratio: number;
  let useGreen: boolean;

  if (value < 0) {
    ratio = range.hasNeg ? negativeIntensityRatio(value, range) : 1;
    useGreen = invertColors;
  } else {
    ratio = range.hasPos ? positiveIntensityRatio(value, range) : 1;
    useGreen = !invertColors;
  }

  const opacity = 0.05 + ratio * 0.55;
  const color = useGreen
    ? `rgba(102, 165, 102, ${opacity})`
    : `rgba(213, 139, 128, ${opacity})`;
  return { backgroundColor: color };
}

function getSortValue(row: ResearchTableRow, key: SortKey): number {
  if (key.type === "rating") return row.rating;
  return row.values[key.index] ?? 0;
}

const SortArrow: FC<{ direction: SortDirection }> = ({ direction }) => (
  <FontAwesomeIcon
    icon={faCaretDown}
    className={cn("ml-1 print:hidden", {
      "rotate-180": direction === "asc",
    })}
  />
);

export const SortableResearchTable: FC<{
  columns: string[];
  rows: ResearchTableRow[];
}> = ({ columns, rows }) => {
  const [sortKey, setSortKey] = useState<SortKey>({
    type: "year",
    index: columns.length - 1,
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    const isSameKey =
      sortKey.type === key.type &&
      (key.type === "rating" ||
        (sortKey.type === "year" && sortKey.index === key.index));
    if (isSameKey) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const isSortActive = (key: SortKey) =>
    sortKey.type === key.type &&
    (key.type === "rating" ||
      (sortKey.type === "year" && sortKey.index === key.index));

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [rows, sortKey, sortDirection]);

  const valueColumnRanges = useMemo(
    () =>
      columns.map((_, i) =>
        getColumnPosNegRanges(rows.map((r) => r.values[i]))
      ),
    [columns, rows]
  );

  const ratingColumnRange = useMemo(
    () => getColumnPosNegRanges(rows.map((r) => r.rating)),
    [rows]
  );

  return (
    <TableCompact
      className="inverted mt-6 [&_table]:border-separate [&_table]:border-spacing-x-2 [&_table]:border-spacing-y-2 [&_td]:py-0.5 [&_th]:pb-3"
      HeadingSection={
        <div className="mb-4 text-center text-sm font-normal leading-5 text-blue-700 dark:text-blue-400">
          Metaculus Predicted Employment Change
        </div>
      }
    >
      <TableCompactHead>
        <TableCompactRow>
          <TableCompactHeaderCell className="w-[40%]">
            Occupation
          </TableCompactHeaderCell>
          {columns.map((col, i) => (
            <TableCompactHeaderCell
              key={col}
              className="w-[20%] cursor-pointer select-none text-center"
              onClick={() => handleSort({ type: "year", index: i })}
            >
              {col}
              {isSortActive({ type: "year", index: i }) && (
                <SortArrow direction={sortDirection} />
              )}
            </TableCompactHeaderCell>
          ))}
          <TableCompactHeaderCell
            className="w-[20%] cursor-pointer select-none text-center"
            onClick={() => handleSort({ type: "rating" })}
          >
            AI Vulnerability Rating
            {isSortActive({ type: "rating" }) && (
              <SortArrow direction={sortDirection} />
            )}
          </TableCompactHeaderCell>
        </TableCompactRow>
      </TableCompactHead>
      <TableCompactBody>
        {sortedRows.map((row) => (
          <TableCompactRow key={row.name} className="break-inside-avoid">
            <TableCompactCell className="font-medium">
              {row.name}
            </TableCompactCell>
            {row.values.map((value, i) => (
              <TableCompactCell
                key={columns[i]}
                className="text-center"
                style={getCellBackgroundStyle(
                  value ?? 0,
                  valueColumnRanges[i] ?? EMPTY_POS_NEG_RANGE
                )}
              >
                {value != null ? (
                  <PercentageChange value={Number(value.toFixed(1))} />
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </TableCompactCell>
            ))}
            <TableCompactCell
              className="text-center"
              style={getCellBackgroundStyle(
                row.rating,
                ratingColumnRange,
                true
              )}
            >
              <span
                className={
                  row.rating >= 0
                    ? "text-salmon-700 dark:text-salmon-400"
                    : "text-mint-800 dark:text-mint-300"
                }
              >
                {row.rating > 0 ? "+" : ""}
                {row.rating}
              </span>
            </TableCompactCell>
          </TableCompactRow>
        ))}
      </TableCompactBody>
    </TableCompact>
  );
};
