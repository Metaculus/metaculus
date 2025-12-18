"use client";
import { differenceInMilliseconds } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import TournamentCard from "@/components/tournament_card";
import Button from "@/components/ui/button";
import useSearchParams from "@/hooks/use_search_params";
import {
  TournamentPreview,
  TournamentsSortBy,
  TournamentType,
} from "@/types/projects";
import { getProjectLink } from "@/utils/navigation";

import {
  TOURNAMENTS_SEARCH,
  TOURNAMENTS_SORT,
} from "../../constants/query_params";

type Props = {
  items: TournamentPreview[];
  title: string;
  cardsPerPage: number;
  initialCardsCount?: number;
  withEmptyState?: boolean;
  disableClientSort?: boolean;
};

const TournamentsList: FC<Props> = ({
  items,
  title,
  cardsPerPage,
  initialCardsCount,
  withEmptyState,
  disableClientSort = false,
}) => {
  const t = useTranslations();
  const { params } = useSearchParams();

  const searchString = params.get(TOURNAMENTS_SEARCH) ?? "";
  const sortBy: TournamentsSortBy | null = disableClientSort
    ? null
    : (params.get(TOURNAMENTS_SORT) as TournamentsSortBy | null) ??
      TournamentsSortBy.StartDateDesc;

  const filteredItems = useMemo(
    () => filterItems(items, decodeURIComponent(searchString), sortBy),
    [items, searchString, sortBy]
  );

  const [displayItemsCount, setDisplayItemsCount] = useState(
    initialCardsCount ?? cardsPerPage
  );
  const hasMoreItems = displayItemsCount < filteredItems.length;
  // reset pagination when filter applied
  useEffect(() => {
    setDisplayItemsCount(initialCardsCount ?? cardsPerPage);
  }, [cardsPerPage, filteredItems.length, initialCardsCount]);

  if (!withEmptyState && filteredItems.length === 0) {
    return null;
  }

  return (
    <>
      <h2 className="my-8 text-2xl sm:text-3xl">{title}</h2>
      {filteredItems.length === 0 && withEmptyState && (
        <div className="mx-auto mt-4 text-base">{t("noResults")}</div>
      )}
      <div className="w-full">
        <div className="mt-8 grid gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.slice(0, displayItemsCount).map((item) => (
            <TournamentCard
              key={item.id}
              href={getProjectLink(item)}
              headerImageSrc={item.header_image}
              name={item.name}
              questionsCount={item.questions_count}
              prizePool={item.prize_pool}
              closeDate={item.forecasting_end_date || item.close_date}
              showCloseDate={item.type !== TournamentType.QuestionSeries}
              isPrivate={item.default_permission === null}
            />
          ))}
        </div>
        {hasMoreItems && (
          <div className="mb-10 mt-8 flex w-full justify-center">
            <Button
              onClick={() =>
                setDisplayItemsCount((prev) => prev + cardsPerPage)
              }
            >
              Show More
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

function filterItems(
  items: TournamentPreview[],
  searchString: string,
  sortBy: TournamentsSortBy | null
) {
  let filteredItems;

  if (searchString) {
    const sanitizedSearchString = searchString.trim().toLowerCase();
    const words = sanitizedSearchString.split(/\s+/);

    filteredItems = items.filter((item) =>
      words.every((word) => item.name.toLowerCase().includes(word))
    );
  } else {
    filteredItems = items;
  }

  if (!sortBy) {
    return filteredItems;
  }

  return [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case TournamentsSortBy.PrizePoolDesc:
        return Number(b.prize_pool) - Number(a.prize_pool);
      case TournamentsSortBy.CloseDateAsc:
        return differenceInMilliseconds(
          new Date(a.close_date ?? 0),
          new Date(b.close_date ?? 0)
        );
      case TournamentsSortBy.StartDateDesc:
        return differenceInMilliseconds(
          new Date(b.start_date),
          new Date(a.start_date)
        );
      default:
        return 0;
    }
  });
}

export default TournamentsList;
