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
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useMemo } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import useScreenSize from "@/hooks/use_screen_size";
import { PostWithForecasts } from "@/types/post";
import { ProjectIndexWeights } from "@/types/projects";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { getPostLink } from "@/utils/navigation";

import CommunityPrediction, {
  IndexCommunityPrediction,
} from "./index_community_prediction";
import IndexWeightChip from "./index_weight_chip";

type TableItem = {
  title: string;
  weight: number;
  communityPrediction: IndexCommunityPrediction;
  post: PostWithForecasts;
  questionId: number;
};

const columnHelper = createColumnHelper<TableItem>();

type Props = {
  indexWeights: ProjectIndexWeights[];
  HeadingSection?: ReactNode;
};

const IndexQuestionsTable: FC<Props> = ({ indexWeights, HeadingSection }) => {
  const t = useTranslations();

  const data = useMemo(() => getTableData(indexWeights), [indexWeights]);
  const questionsCount = data.length;

  const { width } = useScreenSize();
  const isLargeScreen = width >= 768;

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
              href={getPostLink(
                info.row.original.post,
                info.row.original.questionId
              )}
              className="absolute inset-0"
            />
            {info.getValue()}
          </>
        ),
      }),
      columnHelper.accessor("weight", {
        header: t("indexWeight"),
        cell: (info) => <IndexWeightChip value={info.getValue()} />,
        meta: {
          className: "text-center",
        },
      }),
      columnHelper.accessor("communityPrediction", {
        header: t("indexCP"),
        cell: (info) => (
          <CommunityPrediction
            post={info.row.original.post}
            {...info.getValue()}
          />
        ),
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
    <Table HeadingSection={HeadingSection}>
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHeaderCell
                key={header.id}
                className={cn(header.column.columnDef.meta?.className, {
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
            className={cn("relative", {
              "border-b-0": index === questionsCount - 1,
            })}
          >
            {row.getVisibleCells().map((cell, cellIndex) => (
              <TableCell
                key={cell.id}
                className={cn(cell.column.columnDef.meta?.className)}
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

function getTableData(questions: ProjectIndexWeights[]): TableItem[] {
  const data: TableItem[] = [];
  for (const obj of questions) {
    const question =
      obj.post.question ||
      obj.post.group_of_questions?.questions?.find(
        (q) => obj.question_id === q.id
      );

    if (!question) {
      continue;
    }

    const cpRawValue =
      question.aggregations.recency_weighted.latest?.centers?.[0] ?? null;
    const cpDisplayValue = getDisplayValue({
      value: cpRawValue,
      questionType: question.type,
      scaling: question.scaling,
    });

    data.push({
      title: question.title,
      weight: obj.weight,
      communityPrediction: {
        rawValue: cpRawValue,
        displayValue: cpDisplayValue,
      },
      post: obj.post,
      questionId: obj.question_id,
    });
  }

  return data;
}

const MobileQuestionCell: FC<CellContext<TableItem, string>> = ({ row }) => {
  const { title, weight, communityPrediction, post, questionId } = row.original;

  return (
    <div className="flex flex-col gap-2">
      <Link href={getPostLink(post, questionId)} className="absolute inset-0" />

      <span className="text-sm font-medium leading-5">{title}</span>
      <CommunityPrediction post={post} {...communityPrediction} />
      <IndexWeightChip value={weight} />
    </div>
  );
};

export default IndexQuestionsTable;
