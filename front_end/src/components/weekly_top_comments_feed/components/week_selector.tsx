"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { addDays, addWeeks, format, startOfYear, startOfWeek } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FC, Fragment, useCallback } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";
import { getDateFnsLocale } from "@/utils/formatters/date";

type Props = {
  weekStart: Date;

  className?: string;
};

const DateSelect: FC<Props> = ({ weekStart: selectedWeekStart, className }) => {
  const t = useTranslations();
  const localeStr = useLocale();
  const locale = getDateFnsLocale(localeStr);
  // Add current week option at the top
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek =
    format(selectedWeekStart, "yyyy-MM-dd") ===
    format(currentWeekStart, "yyyy-MM-dd");

  const offset = isCurrentWeek ? 1 : 0;

  const pastWeeksMenuItems = Array.from({ length: 4 }, (_, i) => {
    const itemWeekStart = addWeeks(selectedWeekStart, -(i + offset));
    const itemLastWeekDay = addDays(itemWeekStart, 6);
    return {
      id: i.toString(),
      name: `${format(itemWeekStart, "MMM d", { locale })} - ${format(
        itemLastWeekDay,
        "MMM d",
        { locale }
      )}`,
      href: `/questions/?weekly_top_comments=true&start_date=${format(
        itemWeekStart,
        "yyyy-MM-dd"
      )}`,
      isSelected:
        format(selectedWeekStart, "yyyy-MM-dd") ===
        format(itemWeekStart, "yyyy-MM-dd"),
    };
  });
  const lastWeekDay = addDays(selectedWeekStart, 6);

  const currentWeekItem = {
    id: "current",
    name: t("current_week"),
    href: "/questions/?weekly_top_comments=true",
    isCurrentWeek: true,
    isSelected: isCurrentWeek,
  };

  const dateString = `${format(selectedWeekStart, "MMM d", { locale })} - ${format(
    lastWeekDay,
    "MMM d",
    { locale }
  )}`;

  const currentYear = startOfYear(selectedWeekStart);

  return (
    <Menu as="div" className="relative">
      {() => (
        <>
          <MenuButton
            as="div"
            className="cursor-pointer text-base font-medium leading-6 text-blue-700 dark:text-blue-700-dark"
          >
            {dateString}
          </MenuButton>
          <MenuItems
            as="div"
            className={cn(
              "z-50  w-[200px] origin-top overflow-hidden rounded border border-blue-500 bg-gray-0 shadow-lg dark:border-blue-500-dark dark:bg-gray-0-dark",
              className
            )}
            anchor="bottom start"
          >
            {/* Year Header */}
            <div className="border-b border-blue-400 bg-blue-100 px-2.5 py-1.5 dark:border-blue-400-dark dark:bg-blue-100-dark">
              <div className="text-center text-sm font-medium leading-5 text-blue-700 dark:text-blue-700-dark">
                {currentYear.getFullYear()}
              </div>
            </div>

            {/* Scrollable Items */}
            <div className="flex max-h-[187px] flex-col items-center overflow-y-auto py-1">
              {/* Current Week Option */}
              <MenuItem as={Fragment} key={currentWeekItem.id}>
                {({}) => (
                  <Link
                    href={currentWeekItem.href}
                    className={cn(
                      "block border-b border-blue-200 px-2.5 py-1 text-sm leading-5 text-blue-700 no-underline hover:bg-gray-100 dark:border-blue-200-dark dark:text-blue-700-dark hover:dark:bg-gray-100-dark",
                      currentWeekItem.isSelected ? "font-bold" : "font-medium"
                    )}
                  >
                    {currentWeekItem.name}
                  </Link>
                )}
              </MenuItem>

              {/* Historical Weeks */}
              {pastWeeksMenuItems.map((item) => (
                <MenuItem as={Fragment} key={item.id}>
                  {({}) => (
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-2.5 py-1 text-sm leading-5 text-blue-700 no-underline hover:bg-gray-100 dark:text-blue-700-dark hover:dark:bg-gray-100-dark",
                        item.isSelected ? "font-bold" : "font-normal"
                      )}
                    >
                      {item.name}
                    </Link>
                  )}
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </>
      )}
    </Menu>
  );
};

const WeekSelector: FC<Props> = ({ weekStart, className }) => {
  const router = useRouter();

  const weekEnd = addWeeks(weekStart, 1);

  const navigateWeek = useCallback(
    (direction: "prev" | "next") => {
      const weeksToMove = direction === "prev" ? -1 : 1;
      const newStart = addWeeks(weekStart, weeksToMove);
      const newStartDateString = format(newStart, "yyyy-MM-dd");

      router.push(
        `/questions/?weekly_top_comments=true&start_date=${newStartDateString}`
      );
    },
    [weekStart, router]
  );

  return (
    <div
      className={cn(
        "flex w-fit min-w-[200px] items-center justify-between rounded border border-blue-500 bg-gray-0 px-3 py-2 dark:border-blue-500-dark dark:bg-gray-0-dark",
        className
      )}
    >
      <Button
        size="sm"
        variant="text"
        onClick={() => navigateWeek("prev")}
        className="mr-2 flex items-center justify-center  bg-gray-0 p-0 dark:bg-gray-0-dark"
      >
        <FontAwesomeIcon
          icon={faChevronLeft}
          className="text-base text-blue-600 dark:text-blue-600-dark"
        />
      </Button>

      <div className="flex-1 text-center text-base font-medium leading-6 text-blue-700 dark:text-blue-700-dark">
        <DateSelect weekStart={weekStart} />
      </div>

      <Button
        size="sm"
        variant="text"
        onClick={() => navigateWeek("next")}
        className="ml-2 flex items-center justify-center bg-gray-0 p-0 dark:bg-gray-0-dark"
        disabled={weekEnd > new Date()}
      >
        <FontAwesomeIcon
          icon={faChevronRight}
          className="text-base text-blue-600 dark:text-blue-600-dark"
        />
      </Button>
    </div>
  );
};

export default WeekSelector;
