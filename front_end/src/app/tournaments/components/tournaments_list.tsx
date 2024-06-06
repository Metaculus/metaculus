"use client";
import { isAfter } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState } from "react";

import TournamentCard from "@/components/tournament_card";
import Button from "@/components/ui/button";
import { Tournament } from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";

type Props = {
  items: Tournament[];
  title: string;
  cardsPerPage: number;
  initialCardsCount?: number;
  withDate?: boolean;
};

const TournamentsList: FC<Props> = ({
  items,
  title,
  withDate = true,
  cardsPerPage,
  initialCardsCount,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  const [displayItemsCount, setDisplayItemsCount] = useState(
    initialCardsCount ?? cardsPerPage
  );
  const hasMoreItems = displayItemsCount < items.length;

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

  return (
    <>
      <h2 className="my-8 text-2xl sm:text-3xl">{title}</h2>
      <div className="w-full">
        <div className="mt-8 grid gap-x-5 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.slice(0, displayItemsCount).map((item) => (
            <TournamentCard
              key={item.id}
              href={`/tournaments/${item.slug}`}
              headerImageSrc={item.header_image}
              name={item.name}
              questionsCount={item.questions_count}
              prizePool={item.prize_pool}
              closeDate={item.close_date}
              closeDateFormatter={withDate ? closeDateFormatter : undefined}
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

export default TournamentsList;
