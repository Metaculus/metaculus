"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import LocalDaytime from "@/components/ui/local_daytime";
import { useAuth } from "@/contexts/auth_context";
import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";

type Props = {
  tournament: Tournament;
  variant?: "image_overflow" | "default";
};

const TournamentDropdownMenu: FC<Props> = ({
  tournament,
  variant = "default",
}) => {
  const t = useTranslations();

  const { user } = useAuth();

  const menuItems: MenuItemProps[] = [];

  menuItems.push({
    id: "tournamentStatsHeader",
    element: (
      <p className="mb-4 mt-0 text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("tournamentStats")}
      </p>
    ),
  });
  menuItems.push({
    id: "tournamentStats",
    element: <TournamentStats tournament={tournament} />,
  });

  if (user?.is_superuser) {
    menuItems.push({
      id: "lineBreak",
      element: (
        <hr className="my-4 border-gray-300 dark:border-gray-300-dark" />
      ),
    });
    menuItems.push({
      id: "actionsHeader",
      element: (
        <p className="m-0 mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
          {t("actions")}
        </p>
      ),
    });
    menuItems.push({
      id: "viewDjangoAdmin",
      name: t("viewInDjangoAdmin"),
      link: `/admin/projects/project/${tournament.id}/change/`,
      openNewTab: true,
    });
  }

  if (!menuItems.length) {
    return null;
  }

  return (
    <DropdownMenu
      items={menuItems}
      className="overflow-visible! z-[100] w-[274px] border-gray-500 p-6 dark:border-gray-500-dark"
      itemClassName="!p-0 !py-2"
      textAlign="left"
    >
      <Button
        className={cn({
          "border-0 bg-black/50 hover:bg-black/30 dark:bg-black/50":
            variant === "image_overflow",
        })}
        presentationType="icon"
        variant="tertiary"
      >
        <FontAwesomeIcon
          icon={faEllipsis}
          className={cn({
            "text-gray-0 dark:text-gray-0": variant === "image_overflow",
          })}
        />
      </Button>
    </DropdownMenu>
  );
};

const TournamentStats = ({ tournament }: { tournament: Tournament }) => {
  console.log("TournamentStats", { tournament });
  const t = useTranslations();

  const isUpcoming =
    new Date(tournament.start_date || "").getTime() > Date.now();
  const forecastingClosed =
    tournament.forecasting_end_date &&
    new Date(tournament.forecasting_end_date).getTime() < Date.now();
  const questionsResolved = !!tournament.timeline.latest_actual_resolve_time;
  return (
    <div className="flex flex-col items-start gap-4 self-stretch @container">
      <div className="flex flex-col justify-between gap-4 self-stretch @lg:grid @lg:grid-cols-4 @lg:gap-1 @lg:gap-y-5">
        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {t(isUpcoming ? "opens" : "opened")}:
          </span>
          <span className="text-right text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
            <LocalDaytime date={tournament.start_date} />
          </span>
        </div>

        {tournament.forecasting_end_date && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {forecastingClosed
                ? t("lastQuestionClosed")
                : t("lastQuestionCloses")}
              :
            </span>
            <span className="text-right text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              <LocalDaytime date={tournament.forecasting_end_date} />
            </span>
          </div>
        )}
        {tournament.timeline.latest_scheduled_resolve_time && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {questionsResolved
                ? t("lastQuestionResolved")
                : t("lastQuestionResolves")}
              :
            </span>
            <span className="text-right text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              <LocalDaytime
                date={tournament.timeline.latest_scheduled_resolve_time}
              />
            </span>
          </div>
        )}
        {tournament.close_date && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("winnersAnnounced")}:
            </span>
            <span className="text-right text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              <LocalDaytime date={tournament.close_date} />
            </span>
          </div>
        )}
        <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
          <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
            {t("participants")}:
          </span>
          <span className="text-right text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
            {tournament.forecasters_count}
          </span>
        </div>
        {!!tournament.followers_count && (
          <div className="flex justify-between gap-4 @lg:flex-col @lg:justify-start @lg:gap-1">
            <span className="text-xs font-medium uppercase text-gray-700 dark:text-gray-700-dark">
              {t("followers")}:
            </span>
            <span className="text-right text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark">
              {tournament.followers_count}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentDropdownMenu;
