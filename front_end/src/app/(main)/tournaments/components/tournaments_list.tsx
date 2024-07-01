"use client";
import { differenceInMilliseconds, isAfter } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import {
  TOURNAMENTS_SEARCH,
  TOURNAMENTS_SORT,
} from "@/app/(main)/tournaments/constants/query_params";
import TournamentCard from "@/components/tournament_card";
import Button from "@/components/ui/button";
import useSearchParams from "@/hooks/use_search_params";
import {
  Tournament,
  TournamentsSortBy,
  TournamentType,
} from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";

type Props = {
  items: Tournament[];
  title: string;
  cardsPerPage: number;
  initialCardsCount?: number;
  withEmptyState?: boolean;
};

const TournamentsList: FC<Props> = ({
  items,
  title,
  cardsPerPage,
  initialCardsCount,
  withEmptyState,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { params } = useSearchParams();

  const searchString = params.get(TOURNAMENTS_SEARCH) ?? "";
  const sortBy = params.get(TOURNAMENTS_SORT) as TournamentsSortBy | null;
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

  const closeDateFormatter = (date: Date) => {
    const now = new Date();
    const formattedDate = formatDate(locale, date);

    if (isAfter(now, date)) {
      return t.rich("closedOn", {
        strong: () => (
          <strong className="whitespace-nowrap">{formattedDate}</strong>
        ),
      });
    }

    return t.rich("closesOn", {
      strong: () => (
        <strong className="whitespace-nowrap">{formattedDate}</strong>
      ),
    });
  };

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
              href={
                item.slug
                  ? `/tournaments/${item.slug}`
                  : `/tournaments/${item.id}`
              }
              headerImageSrc={item.header_image}
              name={item.name}
              questionsCount={item.posts_count}
              prizePool={item.prize_pool}
              closeDate={item.close_date}
              closeDateFormatter={
                item.type !== TournamentType.QuestionSeries
                  ? closeDateFormatter
                  : undefined
              }
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
  items: Tournament[],
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
          new Date(a.close_date),
          new Date(b.close_date)
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
