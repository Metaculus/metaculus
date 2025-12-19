"use client";

import { useTranslations } from "next-intl";
import React, { FC, useEffect, useState } from "react";

import ClientMiscApi from "@/services/api/misc/misc.client";
import cn from "@/utils/core/cn";

import {
  NasdaqLogo,
  ForbesLogo,
  TheAtlanticLogo,
  AeiLogo,
  TheEconomistLogo,
  BloombergLogo,
} from "./featured-in-logos";

const FEATURED_IN = [
  {
    href: "https://www.nasdaq.com/",
    label: "Nasdaq",
    component: (
      <NasdaqLogo className="h-5 w-auto text-[#171717] dark:text-white" />
    ),
  },
  {
    href: "https://www.forbes.com/",
    label: "Forbes",
    component: (
      <ForbesLogo className="h-5 w-auto text-[#171717] dark:text-white" />
    ),
  },
  {
    href: "https://www.theatlantic.com/",
    label: "The Atlantic",
    component: (
      <TheAtlanticLogo className="h-8 w-auto text-[#171717] dark:text-white " />
    ),
  },
  {
    href: "https://www.aei.org/",
    label: "AEI",
    component: (
      <AeiLogo className="h-5 w-auto text-[#008CCC] dark:text-white" />
    ),
  },
  {
    href: "https://www.theaeconomist.com/",
    label: "The Economist",
    component: <TheEconomistLogo className="h-5 w-auto " />,
  },
  {
    href: "https://www.bloomberg.com/",
    label: "Bloomberg",
    component: (
      <BloombergLogo className="h-5 w-auto text-[#171717] dark:text-white " />
    ),
  },
];

const fetchSiteStats = async () => {
  try {
    return await ClientMiscApi.getSiteStats();
  } catch {
    // silenty fail
    return null;
  }
};

const WhyMetaculus: FC<{ className?: string }> = ({ className }) => {
  const t = useTranslations();
  const [siteStats, setSiteStats] = useState({
    predictions: 2133159,
    questions: 17357,
    years_of_predictions: 10,
  });

  useEffect(() => {
    fetchSiteStats().then((stats) => {
      if (!stats) {
        return;
      }

      setSiteStats({
        predictions: stats.predictions,
        questions: stats.questions,
        years_of_predictions: stats.years_of_predictions,
      });
    });
  }, []);

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-gray-200 px-6 py-5 dark:bg-gray-200-dark md:gap-4 xl:flex-row xl:items-center xl:gap-6",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-base font-bold text-gray-700 dark:text-gray-700-dark">
        {t("whatsMetaculus")}
      </h2>

      {/* Divider */}
      <div className="h-px w-full bg-gray-300 dark:bg-gray-300-dark xl:h-16 xl:w-px xl:shrink-0" />

      <div className="flex flex-1 flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between xl:gap-6">
        {/* Description & Stats */}
        <div className="flex flex-col gap-3 xl:flex-1">
          <p className="m-0 text-sm font-medium leading-5 text-gray-800 dark:text-gray-800-dark">
            {t("metaculusDescription")}
          </p>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between xl:justify-start xl:gap-8">
            <Stat
              number={siteStats.questions.toLocaleString()}
              label={t("openQuestions")}
            />
            <Stat
              number={siteStats.predictions.toLocaleString()}
              label={t("forecastsSubmitted")}
            />
            <Stat
              number={siteStats.years_of_predictions.toLocaleString()}
              label={t("yearsOfPrediction")}
            />
          </div>
        </div>

        {/* Divider 2 */}
        <div className="h-px w-full bg-gray-300 dark:bg-gray-300-dark xl:h-16 xl:w-px xl:shrink-0" />

        {/* Featured In */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-700-dark">
            {t("featuredIn")}
          </span>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-8 md:gap-x-6">
            {[0, 3].map((startIdx) => (
              <div key={startIdx} className="flex items-center gap-12 md:gap-6">
                {FEATURED_IN.slice(startIdx, startIdx + 3).map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="block transition-opacity hover:opacity-80"
                  >
                    {item.component}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat: FC<{ number: string; label: string }> = ({ number, label }) => (
  <div className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-700-dark">
    <span>{number}</span>
    <span className="text-nowrap">{label}</span>
  </div>
);

export default WhyMetaculus;
