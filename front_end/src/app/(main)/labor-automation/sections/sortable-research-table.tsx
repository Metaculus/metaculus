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

function getCellBackgroundStyle(
  value: number,
  maxAbsValue: number,
  invertColors = false
): CSSProperties {
  if (value === 0) return {};
  const ratio = Math.min(Math.abs(value) / maxAbsValue, 1);
  const opacity = 0.05 + ratio * 0.55;
  const isPositive = value > 0;
  const useGreen = invertColors ? !isPositive : isPositive;
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
    className={cn("ml-1", {
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
          <TableCompactRow key={row.name}>
            <TableCompactCell className="font-medium">
              {row.name}
            </TableCompactCell>
            {row.values.map((value, i) => (
              <TableCompactCell
                key={columns[i]}
                className="text-center"
                style={getCellBackgroundStyle(value ?? 0, 100)}
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
              style={getCellBackgroundStyle(row.rating, 2, true)}
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
