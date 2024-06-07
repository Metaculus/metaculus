import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";
import invariant from "ts-invariant";

import HtmlContent from "@/components/html_content";
import ProjectsApi from "@/services/projects";
import { TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";

export default async function TournamentSlug({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = await ProjectsApi.getSlugTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);

  const t = await getTranslations();
  const locale = await getLocale();
  const title =
    tournament.type === TournamentType.QuestionSeries
      ? t("QuestionSeries")
      : t("Tournament");

  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-[780px] flex-auto bg-gray-0 px-0">
      <div
        className={classNames(
          " flex flex-wrap items-center gap-2.5 rounded-t px-3 py-1.5 text-[20px] uppercase text-gray-100 dark:text-gray-100-dark",
          tournament.type === TournamentType.QuestionSeries
            ? "bg-gray-500 dark:bg-gray-500-dark"
            : "bg-blue-600 dark:bg-blue-600-dark"
        )}
      >
        <Link
          href={"/tournaments"}
          className="no-underline hover:text-gray-400 dark:hover:text-gray-400-dark"
        >
          {title}
        </Link>
      </div>
      {!!tournament.header_image && (
        <div className="relative h-[130px] w-full">
          <Image
            src={`https://metaculus-media.s3.amazonaws.com/${tournament.header_image}`}
            alt=""
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 780px"
          />
        </div>
      )}
      <div className="bg-gray-0 px-3 dark:bg-gray-0-dark">
        <div className="pb-2">
          <h1>{tournament.name}</h1>
        </div>
        <div className="flex flex-wrap gap-9 py-4">
          {tournament.prize_pool !== null && (
            <TournamentStat
              title={t("prizePool")}
              text={"$" + Number(tournament.prize_pool).toLocaleString()}
            />
          )}
          <TournamentStat
            title={t("StartDate")}
            text={formatDate(locale, new Date(tournament.start_date))}
          />
          <TournamentStat
            title={t("EndDate")}
            text={formatDate(locale, new Date(tournament.close_date))}
          />
          <TournamentStat
            title={t("questions")}
            text={tournament.questions_count.toString()}
          />
        </div>
        <HtmlContent content={tournament.description} />
      </div>
    </main>
  );
}

const TournamentStat: FC<{ title: string; text: string }> = ({
  text,
  title,
}) => (
  <div className="flex flex-col">
    <span className="font-semibold capitalize leading-5">{title}</span>
    <span className="text-xl font-bold leading-6">{text}</span>
  </div>
);
