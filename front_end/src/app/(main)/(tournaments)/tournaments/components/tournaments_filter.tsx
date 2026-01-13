"use client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import Listbox, { SelectOption } from "@/components/ui/listbox";
import { useBreakpoint } from "@/hooks/tailwind";
import useSearchParams from "@/hooks/use_search_params";
import { TournamentsSortBy } from "@/types/projects";

import { useTournamentsSection } from "./tournaments_provider";
import { TOURNAMENTS_SORT } from "../constants/query_params";

const TournamentsFilter: React.FC = () => {
  const t = useTranslations();
  const { closeInfo } = useTournamentsSection();
  const { params, setParam, shallowNavigateToSearchParams } = useSearchParams();
  const sortBy =
    (params.get(TOURNAMENTS_SORT) as TournamentsSortBy) ??
    TournamentsSortBy.Featured;

  const sortOptions: SelectOption<TournamentsSortBy>[] = [
    { value: TournamentsSortBy.Featured, label: t("featured") },
    {
      label: t("highestPrizePool"),
      value: TournamentsSortBy.PrizePoolDesc,
    },
    {
      label: t("endingSoon"),
      value: TournamentsSortBy.CloseDateAsc,
    },
    {
      label: t("newest"),
      value: TournamentsSortBy.StartDateDesc,
    },
  ];
  const handleSortByChange = (value: TournamentsSortBy) => {
    setParam(TOURNAMENTS_SORT, value, false);
    shallowNavigateToSearchParams();
  };

  const isLg = useBreakpoint("lg");

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) closeInfo();
    },
    [closeInfo]
  );

  return (
    <Listbox
      className="h-9 rounded-full bg-gray-0 px-3.5 text-base dark:bg-gray-0-dark"
      onChange={handleSortByChange}
      onOpenChange={handleOpenChange}
      options={sortOptions}
      value={sortBy}
      menuPosition={isLg ? "right" : "left"}
    />
  );
};

export default TournamentsFilter;
