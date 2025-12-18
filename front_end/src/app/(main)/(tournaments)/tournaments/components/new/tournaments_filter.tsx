"use client";
import { useTranslations } from "next-intl";

import Listbox, { SelectOption } from "@/components/ui/listbox";
import useSearchParams from "@/hooks/use_search_params";
import { TournamentsSortBy } from "@/types/projects";

import { TOURNAMENTS_SORT } from "../../constants/query_params";

const TournamentsFilter: React.FC = () => {
  const t = useTranslations();
  const { params, setParam, shallowNavigateToSearchParams } = useSearchParams();
  const sortBy =
    (params.get(TOURNAMENTS_SORT) as TournamentsSortBy) ??
    TournamentsSortBy.StartDateDesc;

  const sortOptions: SelectOption<TournamentsSortBy>[] = [
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

  return (
    <Listbox
      className="h-9 rounded-full bg-gray-0 px-[14px] text-base dark:bg-gray-0-dark"
      onChange={handleSortByChange}
      options={sortOptions}
      value={sortBy}
    />
  );
};

export default TournamentsFilter;
