"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ConsumerViewDesktopDark from "@/app/(main)/services/assets/consumer-views-desktop-dark.png";
import ConsumerViewDesktopLight from "@/app/(main)/services/assets/consumer-views-desktop-light.png";
import ConsumerViewMobileDark from "@/app/(main)/services/assets/consumer-views-mobile-dark.png";
import ConsumerViewMobileLight from "@/app/(main)/services/assets/consumer-views-mobile-light.png";
import ForecastSection from "@/app/(main)/services/assets/forecast-section.png";
import ClientImage from "@/app/(main)/services/components/client_image";

const PlatfromSection: FC = () => {
  const t = useTranslations();
  return (
    <div className="mt-[60px] text-center text-blue-700 dark:text-blue-700-dark sm:mt-16 lg:mt-[120px]">
      <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark">
        {t("theMetaculusPlatform")}
      </h3>
      <p className="m-0 mx-auto mt-3 max-w-[240px] text-pretty text-sm font-medium text-blue-700 dark:text-blue-700-dark sm:max-w-full sm:text-xl">
        {t("advancedForecastingCapabilities")}
      </p>
      <div className="mt-10 text-blue-700 dark:text-blue-700-dark">
        <div className="flex flex-col xl:flex-row">
          <Image
            src={ForecastSection}
            alt="Consumer views"
            className="w-full xl:w-[695px]"
          />
          <div className="mt-[30px] flex flex-col gap-6 sm:mt-[40px] sm:flex-row xl:-order-1 xl:my-auto xl:mr-14 xl:min-w-[316px] xl:flex-col">
            <div className="w-full">
              <p className="m-0 text-lg font-bold sm:px-7 sm:text-xl xl:px-0">
                {t("richForecastingInterface")}
              </p>
              <p className="m-0 mt-2.5 px-4 text-sm sm:px-5 xl:px-0">
                {t("captureForecastsAcrossTeams")}
              </p>
            </div>

            <div className="w-full xl:mt-14">
              <p className="m-0 text-lg font-bold sm:px-5 sm:text-xl xl:px-0">
                <span className="md:hidden">{t("crowdAggregationModels")}</span>
                <span className="hidden md:inline">
                  {t("builtInAccuracyTracking")}
                </span>
              </p>
              <p className="m-0 mt-2.5 px-4 text-sm sm:px-5 xl:px-0">
                {t("forecastPerformanceIsTracked")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-[50px] flex flex-col sm:mt-[60px] md:mt-[94px] lg:mt-[60px] xl:mt-[30px] xl:flex-row">
          <ClientImage
            lightSrc={ConsumerViewDesktopLight}
            darkSrc={ConsumerViewDesktopDark}
            alt="Consumer views"
            className="hidden w-full xl:block xl:w-[685px]"
          />
          <ClientImage
            lightSrc={ConsumerViewMobileLight}
            darkSrc={ConsumerViewMobileDark}
            alt="Consumer views"
            className="w-full xl:hidden"
          />
          <div className="mt-[30px] flex flex-col gap-6 sm:mt-[40px] sm:flex-row xl:my-auto xl:ml-12 xl:flex-col">
            <div className="w-full">
              <p className="m-0 text-lg font-bold sm:px-8 sm:text-xl xl:px-0">
                {t("organizedCollaboration")}
              </p>
              <p className="m-0 mt-2.5 px-4 text-sm sm:px-5 xl:px-0">
                {t("groupForecastsByTeam")}
              </p>
            </div>

            <div className="w-full">
              <p className="m-0 text-lg font-bold sm:px-5 sm:text-xl xl:px-0">
                {t("decisionRelevantInsights")}
              </p>
              <p className="m-0 mt-2.5 px-4 text-sm sm:px-5 xl:px-0">
                {t("transformRawPredictions")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatfromSection;
