"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { FC } from "react";

import tournamentPlaceholder from "@/app/assets/images/tournament.png";
import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

import Button from "../../components/button";

type Props = { tournament: TournamentPreview; className?: string };

const TournamentSpotlight: FC<Props> = ({ tournament, className }) => {
  const t = useTranslations();
  const locale = useLocale();
  const {
    prize_pool: prizePool,
    header_image: headerImage,
    questions_count: questionsCount,
    forecasts_count: forecastsCount,
    forecasters_count: forecastersCount,
    name,
  } = tournament;
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-blue-800", className)}>
      <div className="relative h-[195px] w-full bg-[#e9edf2]">
        <Image
          src={tournamentPlaceholder}
          className="absolute size-full object-contain object-center"
          alt=""
          placeholder={"blur"}
          quality={100}
        />
        {!!headerImage && (
          <Image
            src={headerImage}
            alt=""
            fill
            className="size-full object-cover object-center sm:object-right"
            sizes="(max-width: 768px) 200vw, 100vw"
            quality={100}
          />
        )}
      </div>
      <div className="flex flex-col p-8 sm:px-14 sm:pb-12 lg:flex-row lg:items-start lg:gap-x-12">
        <div className="flex flex-col">
          <p className="m-0 text-[20px] font-semibold leading-[28px] text-olive-500">
            {t("tournamentSpotlight")}
          </p>
          <p className="m-0 mt-5 text-2xl font-bold tracking-tight text-blue-200 sm:text-3xl">
            {name}
          </p>
          <p className="m-0 mt-5 text-sm font-normal text-blue-500 sm:text-base sm:font-medium">
            {t("tournamentSpotlightDescription")}
          </p>

          <div className="mt-8 rounded-md bg-blue-900 p-6">
            <p className="m-0 text-sm italic text-blue-300 sm:text-base">
              {t("tournamentSpotlightFeedback")}
            </p>
            <p className="m-0 mt-3.5 text-base font-bold text-blue-500">
              {t("tournamentSpotlightFeedbackAuthor")}
            </p>
          </div>

          <Button
            href={getProjectLink(tournament)}
            className="mx-auto mt-8 flex lg:mx-0"
          >
            {t("visitTournamentPage")}
          </Button>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 sm:gap-2.5 lg:mt-0 lg:flex lg:w-[282px] lg:flex-[0_0_auto] lg:flex-col">
          <InfoCard
            field={t("prizePool")}
            value={"$" + `${Number(prizePool).toLocaleString(locale)}`}
          />
          <InfoCard
            field={t("participants")}
            value={Number(forecastersCount).toLocaleString(locale)}
          />
          <InfoCard
            field={t("questions")}
            value={Number(questionsCount).toLocaleString(locale)}
          />
          <InfoCard
            field={t("predictions")}
            value={Number(forecastsCount).toLocaleString(locale)}
          />
        </div>
      </div>
    </div>
  );
};

type InfoCardProps = {
  field: string;
  value: string | number;
};

const InfoCard: FC<InfoCardProps> = ({ field, value }) => {
  return (
    <div className="flex w-full min-w-[227px] flex-1 flex-col items-center justify-center gap-1 rounded-md bg-blue-700 p-4 text-center sm:gap-2.5 sm:p-[26px] lg:p-[36px] xl:p-[27px]">
      <p className="m-0 text-xs font-medium uppercase text-blue-500 sm:text-[18px] sm:leading-[25px]">
        {field}
      </p>
      <p className="m-0 text-base font-medium text-blue-200 sm:text-[21px] sm:leading-[31px]">
        {value}
      </p>
    </div>
  );
};
export default TournamentSpotlight;
