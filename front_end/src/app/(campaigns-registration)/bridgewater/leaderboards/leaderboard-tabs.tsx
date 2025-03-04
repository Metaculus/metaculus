"use client";

import Link from "next/link";
import { useState } from "react";

import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@/components/ui/table";
import cn from "@/utils/cn";

type Sheet = {
  name: string;
  data: string[][];
};

type Props = {
  sheets: Sheet[];
  highlightedUser?: string;
};

export default function LeaderboardTabs({ sheets, highlightedUser }: Props) {
  const [activeSheet, setActiveSheet] = useState(sheets[0]?.name || "");
  const [visibleRowsMap, setVisibleRowsMap] = useState<Record<string, number>>(
    () => Object.fromEntries(sheets.map((sheet) => [sheet.name, 125]))
  );
  const currentSheet = sheets.find((s) => s.name === activeSheet);
  const headers = currentSheet?.data[0];

  if (
    !currentSheet ||
    !currentSheet.data ||
    currentSheet.data.length === 0 ||
    !headers
  ) {
    return <div>No data found</div>;
  }

  const getColumnIndex = (header: string) => {
    return headers.findIndex((h) => h.toLowerCase() === header.toLowerCase());
  };

  const rankColumnIndex = getColumnIndex("Rank");
  const usernameColumnIndex = getColumnIndex("Forecaster");
  const totalScoreColumnIndex = getColumnIndex("Total Score");
  const userIDColumn = getColumnIndex("User ID");

  const buttons: GroupButton<string>[] = sheets.map((sheet) => ({
    value: sheet.name,
    label: sheet.name,
  }));

  const dataRows = currentSheet.data.slice(1);
  const highlightedRow = dataRows.find(
    (row) => row[usernameColumnIndex] === highlightedUser
  );
  const otherRows = dataRows.filter(
    (row) => row[usernameColumnIndex] !== highlightedUser
  );

  // Get visible rows for current sheet
  const currentVisibleRows = visibleRowsMap[activeSheet] ?? 125;
  const visibleOtherRows = otherRows.slice(0, currentVisibleRows);
  const reorderedOtherRows = [highlightedRow ?? [], ...visibleOtherRows];

  const hasMoreRows = otherRows.length > currentVisibleRows;

  const handleLoadAll = () => {
    setVisibleRowsMap((prev) => ({
      ...prev,
      [activeSheet]: otherRows.length,
    }));
  };

  return (
    <div className="overflow-x-hidden">
      <div className="mb-6 flex w-full justify-center">
        <ButtonGroup
          value={activeSheet}
          buttons={buttons}
          onChange={setActiveSheet}
          variant="secondary"
          className="w-fit"
        />
      </div>
      <Table>
        <TableHead>
          <TableRow>
            {headers?.map((header: string, index: number) =>
              index !== userIDColumn ? (
                <TableHeaderCell
                  key={index}
                  className={cn(
                    "w-fit min-w-[200px] max-w-[400px] whitespace-normal",
                    index === rankColumnIndex && "w-16 min-w-[64px]",
                    index === usernameColumnIndex && "w-full truncate md:w-64",
                    index === totalScoreColumnIndex &&
                      "ml-4 w-24 min-w-[96px] text-center",
                    index > totalScoreColumnIndex &&
                      "hidden text-center md:table-cell",
                    index >= totalScoreColumnIndex && "tabular-nums"
                  )}
                >
                  {header}
                </TableHeaderCell>
              ) : null
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {reorderedOtherRows.map((row: string[], rowIndex: number) => (
            <TableRow
              key={rowIndex}
              className={cn(
                highlightedUser === row[usernameColumnIndex] &&
                  "bg-orange-200 dark:bg-orange-200-dark"
              )}
            >
              {row.map((cell: string, cellIndex: number) =>
                cellIndex !== userIDColumn ? (
                  <TableCell
                    key={cellIndex}
                    className={cn(
                      cellIndex === rankColumnIndex && "w-16 min-w-[64px]",
                      cellIndex === usernameColumnIndex &&
                        "w-full truncate md:w-64",
                      cellIndex === totalScoreColumnIndex &&
                        "w-24 min-w-[96px] text-right md:text-center",
                      cellIndex === 0 && "font-medium",
                      cellIndex > totalScoreColumnIndex &&
                        "hidden md:table-cell",
                      cellIndex >= totalScoreColumnIndex &&
                        "text-center text-sm tabular-nums"
                    )}
                  >
                    {cellIndex === usernameColumnIndex ? (
                      <Link href={`/accounts/profile/${row[userIDColumn]}`}>
                        {cell}
                      </Link>
                    ) : (
                      cell
                    )}
                  </TableCell>
                ) : null
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {hasMoreRows && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleLoadAll}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Load All
          </button>
        </div>
      )}
    </div>
  );
}
