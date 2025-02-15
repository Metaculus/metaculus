"use client";

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
  const rankColumnIndex = 0;
  const usernameColumnIndex = 1;

  const buttons: GroupButton<string>[] = sheets.map((sheet) => ({
    value: sheet.name,
    label: sheet.name,
  }));

  const currentSheet = sheets.find((s) => s.name === activeSheet);

  if (!currentSheet || !currentSheet.data || currentSheet.data.length === 0) {
    return <div>No data found</div>;
  }

  const headers = currentSheet.data[0];
  const dataRows = currentSheet.data.slice(1);
  const highlightedRow = dataRows.find(
    (row) => row[usernameColumnIndex] === highlightedUser
  );
  const otherRows = dataRows.filter(
    (row) => row[usernameColumnIndex] !== highlightedUser
  );

  return (
    <div className="overflow-x-scroll">
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
            {headers?.map((header: string, index: number) => (
              <TableHeaderCell
                key={index}
                className={cn(
                  "w-fit min-w-[200px] max-w-[400px] overflow-x-scroll whitespace-normal",
                  index === rankColumnIndex && "w-16",
                  index === usernameColumnIndex && "w-64"
                )}
              >
                {header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {highlightedRow && (
            <TableRow className="bg-orange-200 dark:bg-orange-200-dark">
              {highlightedRow.map((cell: string, cellIndex: number) => (
                <TableCell
                  key={cellIndex}
                  className={cellIndex === 0 ? "font-medium" : ""}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          )}
          {otherRows.map((row: string[], rowIndex: number) => (
            <TableRow key={rowIndex}>
              {row.map((cell: string, cellIndex: number) => (
                <TableCell
                  key={cellIndex}
                  className={cellIndex === 0 ? "font-medium" : ""}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
