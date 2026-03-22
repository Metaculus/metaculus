"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth_context";
import ClientMiscApi from "@/services/api/misc/misc.client";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

import HeroFutureEvalSymbol from "./hero_futureeval_symbol";
import HeroGlobeBackground from "./hero_globe_background";
import MetaculusStorefrontLogo from "./metaculus_storefront_logo";
import RadiantLogo from "./radiant_logo";

const HeroSection: FC = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const logoHref = user ? "/questions/" : "/";

  const [stats, setStats] = useState({
    predictions: 2133159,
    questions: 17357,
    years_of_predictions: 10,
  });

  useEffect(() => {
    ClientMiscApi.getSiteStats()
      .then((s) => {
        if (s) {
          setStats({
            predictions: s.predictions,
            questions: s.questions,
            years_of_predictions: s.years_of_predictions,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="relative w-full overflow-hidden rounded-b-2xl bg-[#0e1e30] md:rounded-b-3xl">
      <div className="hidden md:block">
        <HeroGlobeBackground />
      </div>

      <div className="relative z-10 mx-auto flex w-full flex-col gap-4 p-4 md:gap-8 md:px-10 md:pb-10 md:pt-8">
        {/* Logo + title */}
        <Link href={logoHref} className="inline-flex items-center no-underline">
          <MetaculusStorefrontLogo className="h-[38px] w-auto text-white md:h-[50px]" />
          <div className="ml-3.5 flex flex-col gap-0.5">
            <span className="text-lg font-bold leading-tight tracking-[-0.36px] text-white md:text-xl">
              Metaculus
            </span>
            <span className="text-xs font-medium text-[#adbfd4] opacity-50 md:text-sm">
              {t("clarityInAComplexWorld")}
            </span>
          </div>
        </Link>

        {/* CTA cards */}
        <div className="flex flex-col gap-2.5 md:gap-5">
          <div className="grid grid-cols-2 gap-2.5 md:gap-5">
            {/* Forecasting Platform */}
            <Link
              href="/questions/"
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-lg p-4 no-underline md:rounded-2xl md:p-10",
                "h-[140px] md:h-[259px]",
                "bg-[#c6d8e8]/80 backdrop-blur-[1px] transition-colors hover:bg-[#c6d8e8]"
              )}
            >
              <div className="absolute -left-[102px] -top-[60px] h-[346px] w-[341px] rounded-full bg-[rgba(41,109,169,0.76)] opacity-40 blur-[51px]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-2 md:justify-start">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-900 md:text-2xl">
                    {t("forecastingPlatform")}
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-sm text-blue-900/50 transition-transform group-hover:translate-x-1 md:text-xl"
                  />
                </div>
                <p className="m-0 text-xs text-blue-800 md:text-base">
                  {t("collectiveIntelligenceForPublicGood")}
                </p>
              </div>
              <div className="relative z-10 hidden flex-wrap gap-x-3.5 gap-y-1 text-base text-blue-800 md:flex">
                <span>
                  <strong className="text-blue-900">
                    {abbreviatedNumber(stats.predictions)}+
                  </strong>{" "}
                  {t("predictions")}
                </span>
                <span>
                  <strong className="text-blue-900">
                    {abbreviatedNumber(stats.questions)}+
                  </strong>{" "}
                  {t("forecastingQuestions")}
                </span>
                <span>
                  <strong className="text-blue-900">
                    {stats.years_of_predictions} {t("years")}
                  </strong>{" "}
                  {t("ofPredictions")}
                </span>
              </div>
            </Link>

            {/* Business Solutions */}
            <Link
              href="/services/"
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-lg p-4 no-underline md:rounded-2xl md:p-10",
                "h-[140px] md:h-[259px]",
                "bg-[#d8c6e8]/80 backdrop-blur-[1px] transition-colors hover:bg-[#d8c6e8]"
              )}
            >
              <div className="absolute -left-[62px] -top-[57px] h-[346px] w-[341px] rounded-full bg-[rgba(63,25,49,0.76)] opacity-[0.22] blur-[51px]" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-2 md:justify-start">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-900 md:text-2xl">
                    {t("businessSolutions")}
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-sm text-purple-900/50 transition-transform group-hover:translate-x-1 md:text-xl"
                  />
                </div>
                <p className="m-0 text-xs text-purple-900 md:text-base">
                  {t("forInformedDecisionMaking")}
                </p>
              </div>
              <div className="relative z-10 hidden flex-wrap gap-x-2.5 gap-y-1.5 text-base text-purple-900 md:flex">
                <span>
                  <strong>{t("hire")}</strong> {t("proForecasters")}
                </span>
                <span>
                  <strong>{t("run")}</strong> {t("tournaments")}
                </span>
                <span>
                  <strong>{t("host")}</strong> {t("privateInstances")}
                </span>
              </div>
            </Link>
          </div>

          {/* FutureEval + Radiant banners */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1 md:gap-5">
            {/* FutureEval banner */}
            <Link
              href="/futureeval/"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-lg bg-[#4c6076]/80 p-4 no-underline backdrop-blur-[1px] transition-colors hover:bg-[#4c6076] md:flex-row md:items-center md:gap-4 md:rounded-2xl md:px-6 md:py-4"
            >
              <div className="absolute -left-[33px] -top-[39px] h-[130px] w-[127px] rounded-full bg-[rgba(41,169,156,0.76)] opacity-40 blur-[51px] md:-left-[142px] md:-top-[140px] md:h-[346px] md:w-[341px]" />
              <div className="relative z-10 flex items-center justify-between md:w-[170px] md:shrink-0 md:justify-start">
                <div className="flex items-center gap-2 md:gap-3">
                  <HeroFutureEvalSymbol className="h-4 w-auto shrink-0 md:h-6" />
                  <span className="text-sm font-semibold text-white md:text-xl">
                    FutureEval
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-sm text-white/50 transition-transform group-hover:translate-x-1 md:hidden"
                />
              </div>
              <p className="relative z-10 m-0 text-xs font-medium text-white opacity-50 md:flex-1 md:text-[15px] md:opacity-100">
                {t("measuringForecastingAccuracyOfAI")}
              </p>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="relative z-10 hidden text-white/50 transition-transform group-hover:translate-x-1 md:block md:text-xl"
              />
            </Link>

            {/* Radiant banner */}
            <Link
              href="/radiant/"
              className="group relative flex flex-col gap-3 overflow-hidden rounded-lg bg-[#4c6076]/80 p-4 no-underline backdrop-blur-[1px] transition-colors hover:bg-[#4c6076] md:flex-row md:items-center md:gap-4 md:rounded-2xl md:px-6 md:py-4"
            >
              <div className="absolute -left-[67px] -top-[63px] h-[132px] w-[131px] rounded-full bg-[rgba(255,228,203,0.5)] opacity-40 blur-[39px] md:-left-[166px] md:-top-[156px] md:h-[346px] md:w-[341px] md:blur-[51px]" />
              <div className="relative z-10 flex items-center justify-between md:w-[170px] md:shrink-0 md:justify-start">
                <div className="flex items-center gap-2 md:gap-3">
                  <RadiantLogo className="size-4 text-white md:size-7" />
                  <span className="text-sm font-semibold text-white md:text-xl">
                    {t("radiant")}
                  </span>
                </div>
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-sm text-white/50 transition-transform group-hover:translate-x-1 md:hidden"
                />
              </div>
              <p className="relative z-10 m-0 text-xs font-medium text-white opacity-50 md:flex-1 md:text-[15px] md:opacity-100">
                {t("mapTheFutureBeforeYouBuildIt")}
              </p>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="relative z-10 hidden text-white/50 transition-transform group-hover:translate-x-1 md:block md:text-xl"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
