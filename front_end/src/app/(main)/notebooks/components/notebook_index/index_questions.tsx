"use client";

import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CellContext,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import classNames from "classnames";
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { useBreakpoint } from "@/hooks/tailwind";
import { PostWithForecasts, PostWithForecastsAndWeight } from "@/types/post";
import { getDisplayValue } from "@/utils/charts";
import { getPostLink } from "@/utils/navigation";

import CommunityPrediction, {
  IndexCommunityPrediction,
} from "./index_community_prediction";
import WeightChip from "./weight_chip";

type TableItem = {
  title: string;
  weight: number;
  communityPrediction: IndexCommunityPrediction;
  post: PostWithForecasts;
};

const columnHelper = createColumnHelper<TableItem>();

type Props = {
  indexQuestions: PostWithForecastsAndWeight[];
};

const IndexQuestions: FC<Props> = ({ indexQuestions }) => {
  const t = useTranslations();

  const data = useMemo(() => getTableData(indexQuestions), [indexQuestions]);
  const questionsCount = data.length;

  const isLargeScreen = useBreakpoint("md");

  const columns = useMemo(() => {
    if (!isLargeScreen) {
      return [
        columnHelper.accessor("title", {
          header: t("indexQuestion"),
          cell: MobileQuestionCell,
        }),
      ];
    }

    return [
      columnHelper.accessor("title", {
        header: t("indexQuestion"),
        cell: (info) => (
          <>
            <Link
              href={getPostLink(info.row.original.post)}
              className="absolute inset-0"
            />
            {info.getValue()}
          </>
        ),
      }),
      columnHelper.accessor("weight", {
        header: t("indexWeight"),
        cell: (info) => <WeightChip value={info.getValue()} />,
        meta: {
          className: "text-center",
        },
      }),
      columnHelper.accessor("communityPrediction", {
        header: t("indexCP"),
        cell: (info) => <CommunityPrediction {...info.getValue()} />,
        meta: {
          className: "text-center",
        },
        sortingFn: (rowA, rowB) => {
          const aScore = rowA.original.communityPrediction.rawValue;
          const bScore = rowB.original.communityPrediction.rawValue;

          if (isNil(aScore) && isNil(bScore)) {
            return 0;
          }

          if (isNil(aScore)) {
            return 1;
          }

          if (isNil(bScore)) {
            return -1;
          }

          return aScore - bScore;
        },
      }),
    ];
  }, [t, isLargeScreen]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Table>
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHeaderCell
                key={header.id}
                className={classNames(header.column.columnDef.meta?.className, {
                  "cursor-pointer select-none": header.column.getCanSort(),
                })}
                onClick={header.column.getToggleSortingHandler()}
                colSpan={header.index === 0 ? 2 : undefined}
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
                {{
                  asc: (
                    <FontAwesomeIcon
                      icon={faCaretDown}
                      className="ml-2 rotate-180"
                    />
                  ),
                  desc: <FontAwesomeIcon icon={faCaretDown} className="ml-2" />,
                }[header.column.getIsSorted() as string] ?? null}
              </TableHeaderCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {table.getRowModel().rows.map((row, index) => (
          <TableRow
            key={row.id}
            className={classNames("relative", {
              "border-b-0": index === questionsCount - 1,
            })}
          >
            {row.getVisibleCells().map((cell, cellIndex) => (
              <TableCell
                key={cell.id}
                className={classNames(cell.column.columnDef.meta?.className)}
                colSpan={cellIndex === 0 ? 2 : undefined}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

function getTableData(questions: PostWithForecastsAndWeight[]): TableItem[] {
  const data: TableItem[] = [];
  for (const post of questions) {
    if (!post.question) {
      continue;
    }

    const cpRawValue =
      post.question.aggregations.recency_weighted.latest?.centers?.[0] ?? null;
    const cpDisplayValue = getDisplayValue(
      cpRawValue,
      post.question.type,
      post.question.scaling
    );

    data.push({
      title: post.title,
      weight: post.weight,
      communityPrediction: {
        rawValue: cpRawValue,
        displayValue: cpDisplayValue,
        weekMovement: null, // TODO: calculate movement
      },
      post,
    });
  }

  return data;
}

const MobileQuestionCell: FC<CellContext<TableItem, string>> = ({ row }) => {
  const { title, weight, communityPrediction, post } = row.original;

  return (
    <div className="flex flex-col gap-2">
      <Link href={getPostLink(post)} className="absolute inset-0" />

      <span className="text-sm font-medium leading-5">{title}</span>
      <CommunityPrediction {...communityPrediction} />
      <WeightChip value={weight} />
    </div>
  );
};

export default IndexQuestions;
