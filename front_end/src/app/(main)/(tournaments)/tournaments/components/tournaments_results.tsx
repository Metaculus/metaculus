"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React from "react";

import cn from "@/utils/core/cn";

import { useTournamentsSection } from "./tournaments_provider";
import { TOURNAMENTS_SEARCH } from "../constants/query_params";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const TournamentsResults: React.FC<Props> = ({ children, className }) => {
  const t = useTranslations();
  const { count } = useTournamentsSection();
  const params = useSearchParams();

  const q = (params.get(TOURNAMENTS_SEARCH) ?? "").trim();
  const isSearching = q.length > 0;

  type PlainKey = Parameters<typeof t>[0];

  if (count > 0) {
    return <div className={className}>{children}</div>;
  }

  const titleKey = (
    isSearching ? "tournamentsEmptySearchTitle" : "tournamentsEmptyDefaultTitle"
  ) as PlainKey;

  const bodyKey = (
    isSearching ? "tournamentsEmptySearchBody" : "tournamentsEmptyDefaultBody"
  ) as PlainKey;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "min-h-[260px] lg:min-h-[360px]",
        className
      )}
    >
      <div className="text-center">
        <p className="my-0 text-[18px] font-medium text-blue-800/70 dark:text-blue-800-dark/70">
          {t(titleKey, { count })}
        </p>

        <p className="mt-2 text-sm text-blue-700/60 dark:text-blue-700-dark/60">
          {t(bodyKey)}
        </p>
      </div>
    </div>
  );
};

export default TournamentsResults;
