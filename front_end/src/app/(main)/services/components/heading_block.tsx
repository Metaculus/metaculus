"use client";
import { faArrowTrendUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import useAppTheme from "@/hooks/use_app_theme";
import { SiteStats } from "@/services/api/misc/misc.shared";
import { abbreviatedNumber } from "@/utils/formatters/number";

import Button from "./button";
import * as HeadingDark from "../assets/heading-dark.svg";
import * as HeadingLight from "../assets/heading-light.svg";

type Props = {
  siteStats: SiteStats;
};

const HeadingBlock: FC<Props> = ({ siteStats }) => {
  const t = useTranslations();
  const { theme } = useAppTheme();
  return (
    <div className="flex flex-col items-center gap-[42px] text-center text-blue-700 dark:text-blue-700-dark lg:flex-row">
      <div className="flex flex-col items-center lg:items-start">
        <h2 className="m-0 text-[32px] leading-[116%] text-blue-800 dark:text-blue-800-dark sm:text-5xl lg:text-start">
          {t("partnerWith")}{" "}
          <span className="inline-block w-full text-blue-700 dark:text-blue-700-dark md:w-auto lg:w-full">
            Metaculus
          </span>
        </h2>
        <p className="m-0 mt-5 text-balance text-sm font-normal sm:max-w-[500px] sm:text-[21px] sm:leading-8 lg:text-start">
          Metaculus is a forecasting platform helping organizations make better
          decisions by aggregating predictions on global events.
        </p>
        <div className="my-6 flex flex-col items-center gap-3 text-sm lowercase text-blue-600 dark:text-blue-600-dark sm:my-10 sm:text-xl lg:items-start">
          <p className="m-0 flex items-center justify-center text-sm sm:text-xl">
            <FontAwesomeIcon
              icon={faArrowTrendUp}
              width={14}
              className="mr-2.5 text-blue-500 dark:text-blue-500-dark"
            />
            <span className="font-bold uppercase text-blue-700 dark:text-blue-700-dark">
              {abbreviatedNumber(siteStats.predictions)}+
            </span>
            &nbsp;
            {t("predictions")}
          </p>
          <p className="m-0 flex items-center justify-center text-sm sm:text-xl">
            <FontAwesomeIcon
              icon={faArrowTrendUp}
              width={14}
              className="mr-2.5 text-blue-500 dark:text-blue-500-dark"
            />
            <span className="font-bold uppercase text-blue-700 dark:text-blue-700-dark">
              {abbreviatedNumber(siteStats.questions)}+
            </span>
            &nbsp;
            {t("forecastingQuestions")}
          </p>
          <p className="m-0 flex items-center justify-center text-sm sm:text-xl">
            <FontAwesomeIcon
              icon={faArrowTrendUp}
              width={14}
              className="mr-2.5 text-blue-500 dark:text-blue-500-dark"
            />
            <span className="font-bold uppercase text-blue-700 dark:text-blue-700-dark">
              {abbreviatedNumber(siteStats.resolved_questions)}+
            </span>
            &nbsp;
            {t("questionsResolved")}
          </p>
          <p className="m-0 flex items-center justify-center text-sm sm:text-xl">
            <FontAwesomeIcon
              icon={faArrowTrendUp}
              width={14}
              className="mr-2.5 text-blue-500 dark:text-blue-500-dark"
            />
            <span className="font-bold text-blue-700 dark:text-blue-700-dark">
              {siteStats.years_of_predictions} {t("years")}
            </span>
            &nbsp;
            {t("ofPredictions")}
          </p>
        </div>
        <Button href="#contact-us">{t("contactUs")}</Button>
      </div>
      <Image
        src={theme === "light" ? HeadingLight : HeadingDark}
        alt="heading"
        width={538}
        height={480}
        unoptimized
        className="mx-auto block max-w-[272px] sm:max-w-[417px] lg:max-w-[427px] xl:max-w-[538px]"
      />
    </div>
  );
};

export default HeadingBlock;
