"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import React, { FC } from "react";

import { PostWithForecastsAndWeight } from "@/types/post";
type Props = {
  indexQuestions: PostWithForecastsAndWeight[];
};

const columns = [
  {
    accessorKey: "title",
    header: "Question",
    cell: (props: any) => <p>{props.getValue()}</p>,
  },
  {
    accessorKey: "weight",
    header: "Weight",
    cell: (props: any) => <p>{props.getValue()}</p>,
  },
  {
    accessorKey: "cp",
    header: "CP",
    cell: (props: any) => <p>{props.getValue()}</p>,
  },
];

const IndexQuestions: FC<Props> = ({ indexQuestions }) => {
  const tableData = getTableData(indexQuestions);
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div>
      {indexQuestions.map((q) => (
        <div key={q.id}>
          <p>{q.title}</p>
          <p>{q.weight}</p>
          <p>
            {q.question?.aggregations.recency_weighted.latest?.centers?.[0]}
          </p>
        </div>
      ))}
    </div>
  );
};

function getTableData(questions: PostWithForecastsAndWeight[]) {
  return questions.map((q) => {
    return {
      title: q.title,
      weight: q.weight,
      cp: q.question?.aggregations.recency_weighted.latest?.centers?.[0],
      movement: 10, // calculate movement based in aggregations data
    };
  });
}
export default IndexQuestions;
