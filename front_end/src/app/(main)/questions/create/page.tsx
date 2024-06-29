"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";

const Creator: React.FC = () => {
  const searchParams = useSearchParams();

  const createHref = (path: string) => {
    const params = new URLSearchParams(searchParams);
    return `${path}?${params.toString()}`;
  };

  return (
    <div className="flex w-full flex-col p-8">
      <div className="flex max-w-[640px]">
        <h1 className="text-xl">Write</h1>
      </div>
      <div className="flex max-w-[640px]">
        <p>Create a question, notebook, conditional, etc</p>
      </div>
      <div className="flex w-full flex-row justify-center p-8">
        <Link
          href={createHref("/questions/create/question")}
          className="text-l cursor-pointer rounded-l-3xl border border-black bg-white p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Single Question
        </Link>
        <Link
          href={createHref("/questions/create/group")}
          className="text-l cursor-pointer border border-black bg-white p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Question Group
        </Link>
        <Link
          href={createHref("/questions/create/conditional")}
          className="text-l cursor-pointer border border-black bg-white p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Conditional Pair
        </Link>
        <Link
          href={createHref("/questions/create/notebook")}
          className="text-l cursor-pointer rounded-r-3xl border border-black bg-white p-2 text-center text-black no-underline hover:bg-blue-900"
        >
          Notebook
        </Link>
      </div>
    </div>
  );
};

export default Creator;
