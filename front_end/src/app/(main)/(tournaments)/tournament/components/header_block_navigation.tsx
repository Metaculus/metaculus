import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { Tournament, TournamentType } from "@/types/projects";
import cn from "@/utils/cn";

import TournamentDropdownMenu from "./dropdown_menu";

const HeaderBlockNav: FC<{
  tournament: Tournament;
  variant?: "image_overflow" | "default";
  className?: string;
}> = ({ tournament, variant = "default", className }) => {
  const t = useTranslations();

  let title: string;
  switch (tournament.type) {
    case TournamentType.QuestionSeries:
      title = t("QuestionSeries");
      break;
    case TournamentType.Index:
      title = t("Index");
      break;
    default:
      title = t("Tournament");
      break;
  }

  return (
    <div
      className={cn(
        "flex h-6 w-full flex-wrap items-center justify-between gap-2.5 bg-transparent uppercase text-gray-100 dark:text-gray-100-dark",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Link
          href={"/tournaments"}
          className={cn(
            "block rounded-sm px-1.5 py-1 text-xs font-bold leading-4 no-underline",
            {
              "bg-black/30 text-gray-0 hover:text-gray-400 dark:hover:text-gray-400-dark":
                variant === "image_overflow",
              "bg-blue-700/30 text-blue-700 hover:bg-blue-700/40 dark:bg-blue-700-dark/30 dark:text-blue-700-dark dark:hover:bg-blue-700-dark/40":
                variant === "default",
            }
          )}
        >
          {title}
        </Link>
        {tournament.default_permission === null && (
          <strong
            className={cn(
              "block rounded-sm px-1.5 py-1 text-xs font-bold uppercase leading-4",
              {
                "bg-black/30 text-gray-0": variant === "image_overflow",
                "bg-blue-700/30 text-blue-700 dark:bg-blue-700-dark/30 dark:text-blue-700-dark":
                  variant === "default",
              }
            )}
          >
            {t("private")}
          </strong>
        )}
      </div>
      <TournamentDropdownMenu tournament={tournament} variant={variant} />
    </div>
  );
};

export default HeaderBlockNav;
