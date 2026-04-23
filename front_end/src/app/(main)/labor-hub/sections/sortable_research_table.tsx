"use client";

import {
  faSort,
  faCaretUp,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CSSProperties, FC, useMemo, useState } from "react";

import {
  TableCompact,
  TableCompactHead,
  TableCompactRow,
  TableCompactHeaderCell,
  TableCompactBody,
  TableCompactCell,
  PercentageChange,
} from "../components/table_compact";

type LiteratureMetric = "felten" | "mna" | "aoe";

type SortKey =
  | { type: "year"; index: number }
  | { type: "literature"; metric: LiteratureMetric };
type SortDirection = "asc" | "desc";

export type ResearchTableRow = {
  name: string;
  values: (number | null)[];
  felten: number;
  mna: number;
  aoe: number;
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

type ColumnMinMax = { min: number; max: number; hasValues: boolean };

function getColumnMinMax(values: (number | null | undefined)[]): ColumnMinMax {
  const nums = values.filter(
    (v): v is number => v != null && Number.isFinite(v)
  );
  if (nums.length === 0) return { min: 0, max: 0, hasValues: false };
  return { min: Math.min(...nums), max: Math.max(...nums), hasValues: true };
}

/** Full-range gradient: column midpoint is neutral, min and max anchor opposite ends of the spectrum. */
function getFullSpectrumStyle(
  value: number,
  range: ColumnMinMax,
  invertColors = false
): CSSProperties {
  if (!range.hasValues || range.min === range.max) return {};
  const mid = (range.min + range.max) / 2;
  const half = (range.max - range.min) / 2;
  const ratio = clamp01(Math.abs(value - mid) / half);
  if (ratio === 0) return {};
  const isLow = value < mid;
  const useGreen = isLow === invertColors;
  const opacity = 0.05 + ratio * 0.55;
  const color = useGreen
    ? `rgba(102, 165, 102, ${opacity})`
    : `rgba(213, 139, 128, ${opacity})`;
  return { backgroundColor: color };
}

function getMaxDecimals(values: (number | null | undefined)[]): number {
  return values.reduce<number>((max, v) => {
    if (v == null || !Number.isFinite(v)) return max;
    const s = v.toString();
    const dot = s.indexOf(".");
    return dot === -1 ? max : Math.max(max, s.length - dot - 1);
  }, 0);
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
  if (key.type === "literature") return row[key.metric];
  return row.values[key.index] ?? 0;
}

const SortColumnIndicator: FC<{
  isActive: boolean;
  direction: SortDirection;
}> = ({ isActive, direction }) => {
  if (!isActive) {
    return (
      <FontAwesomeIcon
        icon={faSort}
        aria-hidden="true"
        className="mb-0.5 ml-1 size-3 shrink-0 text-blue-700/25 dark:text-blue-400/25 print:hidden"
      />
    );
  }
  const icon = direction === "asc" ? faCaretUp : faCaretDown;
  return (
    <FontAwesomeIcon
      icon={icon}
      aria-hidden="true"
      className="mb-0.5 ml-1 size-3 shrink-0 text-blue-950 dark:text-white print:hidden"
    />
  );
};

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
      (key.type === "literature"
        ? sortKey.type === "literature" && sortKey.metric === key.metric
        : sortKey.type === "year" && sortKey.index === key.index);
    if (isSameKey) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const isSortActive = (key: SortKey) =>
    sortKey.type === key.type &&
    (key.type === "literature"
      ? sortKey.type === "literature" && sortKey.metric === key.metric
      : sortKey.type === "year" && sortKey.index === key.index);

  const getAriaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    isSortActive(key)
      ? sortDirection === "asc"
        ? "ascending"
        : "descending"
      : "none";

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      return sortDirection === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [rows, sortKey, sortDirection]);

  const valuesSharedRange = useMemo(
    () => getColumnPosNegRanges(rows.flatMap((r) => r.values)),
    [rows]
  );

  const feltenColumnRange = useMemo(
    () => getColumnMinMax(rows.map((r) => r.felten)),
    [rows]
  );
  const mnaColumnRange = useMemo(
    () => getColumnMinMax(rows.map((r) => r.mna)),
    [rows]
  );
  const aoeColumnRange = useMemo(
    () => getColumnMinMax(rows.map((r) => r.aoe)),
    [rows]
  );

  const feltenDecimals = useMemo(
    () => getMaxDecimals(rows.map((r) => r.felten)),
    [rows]
  );
  const mnaDecimals = useMemo(
    () => getMaxDecimals(rows.map((r) => r.mna)),
    [rows]
  );
  const aoeDecimals = useMemo(
    () => getMaxDecimals(rows.map((r) => r.aoe)),
    [rows]
  );

  return (
    <TableCompact
      className="inverted mt-8 [&_td]:p-1 [&_th]:px-1 [&_th]:pb-3"
      HeadingSection={
        <>
          <div className="mb-2 text-center text-base font-normal leading-5 text-gray-800 dark:text-gray-800-dark">
            Metaculus Forecasts Compared to AI Exposure Research
          </div>
          <div className="mb-4 text-balance text-center text-sm font-normal leading-5 text-gray-600 dark:text-gray-600-dark">
            Comparing Metaculus occupational employment forecasts for 2030 and
            2035 to exposure and vulnerability score research from the
            literature. Note that exposure and vulnerability scores are not
            necessarily meant to be predictive of the future, but instead are
            correlational measures of current AI usage and task patterns.
          </div>
        </>
      }
    >
      <TableCompactHead>
        <TableCompactRow>
          <TableCompactHeaderCell
            aria-hidden="true"
            className="sticky left-0 z-10 bg-blue-200 after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-4 after:bg-gradient-to-r after:from-black/15 after:to-transparent after:opacity-0 after:transition-opacity after:content-[''] group-data-[scrolled-x]/scrollable:after:opacity-100 dark:bg-blue-800 dark:after:from-black/40"
          />
          <TableCompactHeaderCell
            colSpan={columns.length}
            className="whitespace-nowrap pb-1 text-center"
          >
            Metaculus Forecasts
          </TableCompactHeaderCell>
          <TableCompactHeaderCell aria-hidden="true" className="w-4" />
          <TableCompactHeaderCell
            colSpan={3}
            className="whitespace-nowrap pb-1 text-center"
          >
            Literature
          </TableCompactHeaderCell>
        </TableCompactRow>
        <TableCompactRow>
          <TableCompactHeaderCell className="sticky left-0 z-10 bg-blue-200 after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-4 after:bg-gradient-to-r after:from-black/15 after:to-transparent after:opacity-0 after:transition-opacity after:content-[''] group-data-[scrolled-x]/scrollable:after:opacity-100 dark:bg-blue-800 dark:after:from-black/40">
            Occupation
          </TableCompactHeaderCell>
          {columns.map((col, i) => {
            const yearSortKey: SortKey = { type: "year", index: i };
            const isActive = isSortActive(yearSortKey);

            return (
              <TableCompactHeaderCell
                key={col}
                className="select-none whitespace-nowrap text-center"
                aria-sort={getAriaSort(yearSortKey)}
              >
                <button
                  type="button"
                  className="font-inherit inline-flex w-full appearance-none items-center justify-center gap-0.5 bg-transparent p-0 text-center text-inherit"
                  onClick={() => handleSort(yearSortKey)}
                >
                  {col}
                  <SortColumnIndicator
                    isActive={isActive}
                    direction={sortDirection}
                  />
                </button>
              </TableCompactHeaderCell>
            );
          })}
          <TableCompactHeaderCell aria-hidden="true" className="w-4" />
          {(
            [
              {
                metric: "felten" as const,
                label: (
                  <>
                    Felten<sup className="text-[0.5rem]">1</sup>
                  </>
                ),
                title: "Felten Language AIOE",
              },
              {
                metric: "mna" as const,
                label: (
                  <>
                    M&A<sup className="text-[0.5rem]">2</sup>
                  </>
                ),
                title: "M&A calculated vulnerability",
              },
              {
                metric: "aoe" as const,
                label: (
                  <>
                    AOE<sup className="text-[0.5rem]">3</sup>
                  </>
                ),
                title: "Anthropic's observed exposure",
              },
            ] as const
          ).map(({ metric, label, title }) => {
            const literatureSortKey: SortKey = { type: "literature", metric };
            const isActive = isSortActive(literatureSortKey);

            return (
              <TableCompactHeaderCell
                key={metric}
                className="select-none whitespace-nowrap text-center"
                aria-sort={getAriaSort(literatureSortKey)}
              >
                <button
                  type="button"
                  title={title}
                  className="font-inherit inline-flex w-full appearance-none items-center justify-center gap-0.5 bg-transparent p-0 text-center text-inherit"
                  onClick={() => handleSort(literatureSortKey)}
                >
                  {label}
                  <SortColumnIndicator
                    isActive={isActive}
                    direction={sortDirection}
                  />
                </button>
              </TableCompactHeaderCell>
            );
          })}
        </TableCompactRow>
      </TableCompactHead>
      <TableCompactBody>
        {sortedRows.map((row) => (
          <TableCompactRow
            key={row.name}
            className="group break-inside-avoid hover:bg-blue-400 dark:hover:bg-blue-700 [&>td:first-child]:rounded-l [&>td:last-child]:rounded-r"
          >
            <TableCompactCell className="sticky left-0 z-10 bg-blue-200 px-3 font-medium after:pointer-events-none after:absolute after:inset-y-0 after:left-full after:w-4 after:bg-gradient-to-r after:from-black/15 after:to-transparent after:opacity-0 after:transition-opacity after:content-[''] group-hover:bg-blue-400 group-data-[scrolled-x]/scrollable:after:opacity-100 dark:bg-blue-800 dark:after:from-black/40 dark:group-hover:bg-blue-700">
              {row.name}
            </TableCompactCell>
            {row.values.map((value, i) => (
              <TableCompactCell
                key={columns[i]}
                className="whitespace-nowrap text-center tabular-nums"
              >
                <div
                  className="rounded px-1.5 py-1 md:px-3"
                  style={getCellBackgroundStyle(value ?? 0, valuesSharedRange)}
                >
                  {value != null ? (
                    <PercentageChange
                      value={value}
                      decimals={1}
                      applyColor={false}
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
              </TableCompactCell>
            ))}
            <TableCompactCell aria-hidden="true" className="w-4" />
            <TableCompactCell className="whitespace-nowrap text-center tabular-nums">
              <div
                className="rounded px-1.5 py-1 md:px-3"
                style={getFullSpectrumStyle(
                  row.felten,
                  feltenColumnRange,
                  true
                )}
              >
                <span>
                  {row.felten > 0 ? "+" : ""}
                  {row.felten.toFixed(feltenDecimals)}
                </span>
              </div>
            </TableCompactCell>
            <TableCompactCell className="whitespace-nowrap text-center tabular-nums">
              <div
                className="rounded px-1.5 py-1 md:px-3"
                style={getFullSpectrumStyle(row.mna, mnaColumnRange, true)}
              >
                {row.mna.toFixed(mnaDecimals)}
              </div>
            </TableCompactCell>
            <TableCompactCell className="whitespace-nowrap text-center tabular-nums">
              <div
                className="rounded px-1.5 py-1 md:px-3"
                style={getFullSpectrumStyle(row.aoe, aoeColumnRange, true)}
              >
                {row.aoe.toFixed(aoeDecimals)}%
              </div>
            </TableCompactCell>
          </TableCompactRow>
        ))}
      </TableCompactBody>
    </TableCompact>
  );
};
