"use client";

import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { addDays, addWeeks, format, startOfYear, startOfWeek } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC, Fragment, useCallback } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";
import { getDateFnsLocale } from "@/utils/formatters/date";

import { WEEK_START_DAY } from "./constants";

type Props = {
  weekStart: Date;
  className?: string;
  onWeekChange: (newWeekStart: Date) => void;
};

const DateSelect: FC<Props> = ({
  weekStart: selectedWeekStart,
  className,
  onWeekChange,
}) => {
  const t = useTranslations();
  const localeStr = useLocale();
  const locale = getDateFnsLocale(localeStr);

  const currentWeekStart = startOfWeek(new Date(), {
    weekStartsOn: WEEK_START_DAY,
  });
  const isCurrentWeek =
    format(selectedWeekStart, "yyyy-MM-dd") ===
    format(currentWeekStart, "yyyy-MM-dd");

  const weeksCount = 10;
  const pastWeeksMenuItems = Array.from({ length: weeksCount }, (_, i) => {
    const itemWeekStart = addWeeks(currentWeekStart, -(i + 1));
    const itemLastWeekDay = addDays(itemWeekStart, 6);
    return {
      id: i.toString(),
      name: `${format(itemWeekStart, "MMM d", { locale })} - ${format(
        itemLastWeekDay,
        "MMM d",
        { locale }
      )}`,
      weekStart: itemWeekStart,
      isSelected:
        format(selectedWeekStart, "yyyy-MM-dd") ===
        format(itemWeekStart, "yyyy-MM-dd"),
    };
  });
  const lastWeekDay = addDays(selectedWeekStart, 6);

  const currentWeekItem = {
    id: "current",
    name: t("current_week"),
    weekStart: currentWeekStart,
    isCurrentWeek: true,
    isSelected: isCurrentWeek,
  };

  const dateString = `${format(selectedWeekStart, "MMM d", { locale })} - ${format(
    lastWeekDay,
    "MMM d",
    { locale }
  )}`;

  const currentYear = startOfYear(selectedWeekStart);

  const handleWeekSelect = useCallback(
    (weekStart: Date) => {
      onWeekChange(weekStart);
    },
    [onWeekChange]
  );

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
                  <button
                    onClick={() => handleWeekSelect(currentWeekItem.weekStart)}
                    className={cn(
                      "block w-full border-b border-blue-200 px-2.5 py-1 text-left text-sm leading-5 text-blue-700 hover:bg-gray-100 dark:border-blue-200-dark dark:text-blue-700-dark hover:dark:bg-gray-100-dark",
                      currentWeekItem.isSelected ? "font-bold" : "font-medium"
                    )}
                  >
                    {currentWeekItem.name}
                  </button>
                )}
              </MenuItem>

              {/* Historical Weeks */}
              {pastWeeksMenuItems.map((item) => (
                <MenuItem as={Fragment} key={item.id}>
                  {({}) => (
                    <button
                      onClick={() => handleWeekSelect(item.weekStart)}
                      className={cn(
                        "block w-full px-2.5 py-1 text-left text-sm leading-5 text-blue-700 hover:bg-gray-100 dark:text-blue-700-dark hover:dark:bg-gray-100-dark",
                        item.isSelected ? "font-bold" : "font-normal"
                      )}
                    >
                      {item.name}
                    </button>
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

const WeekSelector: FC<Props> = ({ weekStart, className, onWeekChange }) => {
  const weekEnd = addWeeks(weekStart, 1);

  const navigateWeek = useCallback(
    (direction: "prev" | "next") => {
      const weeksToMove = direction === "prev" ? -1 : 1;
      const newStart = addWeeks(weekStart, weeksToMove);
      onWeekChange(newStart);
    },
    [weekStart, onWeekChange]
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
        <DateSelect weekStart={weekStart} onWeekChange={onWeekChange} />
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
