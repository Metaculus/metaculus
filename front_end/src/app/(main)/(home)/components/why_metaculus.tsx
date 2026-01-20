"use client";

import { useTranslations } from "next-intl";
import React, { FC, useEffect, useState } from "react";

import ClientMiscApi from "@/services/api/misc/misc.client";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

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
    href: "https://www.nasdaq.com/articles/how-crypto-can-help-secure-ai",
    label: "Nasdaq",
    component: (
      <NasdaqLogo className="h-5 w-auto text-gray-800 dark:text-gray-800-dark" />
    ),
  },
  {
    href: "https://www.forbes.com/sites/stevenwolfepereira/2025/12/08/building-a-one-person-unicorn-this-startup-just-raised-87m-to-help/",
    label: "Forbes",
    component: (
      <ForbesLogo className="h-4 w-auto text-gray-800 dark:text-gray-800-dark" />
    ),
  },
  {
    href: "https://archive.is/0O588",
    label: "The Atlantic",
    component: (
      <TheAtlanticLogo className="h-10 w-auto text-gray-800 dark:text-gray-800-dark" />
    ),
  },
  {
    href: "https://www.aei.org/articles/the-great-ai-forecasting-divide/1",
    label: "AEI",
    component: (
      <AeiLogo className="h-5 w-auto text-[#008CCC] dark:text-gray-800-dark" />
    ),
  },
  {
    href: "https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai",
    label: "The Economist",
    component: <TheEconomistLogo className="h-6 w-auto" />,
  },
  {
    href: "https://www.bloomberg.com/opinion/articles/2024-03-24/can-sam-altman-make-ai-smart-enough-to-answer-these-6-questions",
    label: "Bloomberg",
    component: (
      <BloombergLogo className="h-4 w-auto text-gray-800 dark:text-gray-800-dark" />
    ),
  },
];

const fetchSiteStats = async () => {
  try {
    return await ClientMiscApi.getSiteStats();
  } catch {
    // silently fail
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
        "flex flex-col gap-4 rounded-lg bg-gray-200 px-5 py-4 dark:bg-gray-200-dark md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-5",
        className
      )}
    >
      {/* Left Column: Description & Stats */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:max-w-[400px]">
        <p className="m-0 text-balance text-sm leading-5 text-blue-600 dark:text-blue-600-dark  md:max-w-[400px]">
          <span className="font-bold text-blue-800 dark:text-blue-800-dark">
            Metaculus
          </span>{" "}
          is an{" "}
          <span className="text-blue-800 dark:text-blue-800-dark">
            online forecasting platform
          </span>{" "}
          focusing on{" "}
          <span className="text-blue-800 dark:text-blue-800-dark">
            topics of global importance
          </span>
          .
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Stat
            number={`${abbreviatedNumber(siteStats.questions)}+`}
            label={t("openQuestions")}
          />
          <Stat
            number={`${abbreviatedNumber(siteStats.predictions)}+`}
            label={t("forecastsSubmitted")}
          />
          <Stat
            number={String(siteStats.years_of_predictions)}
            label={t("yearsOfPrediction")}
          />
        </div>
      </div>

      {/* Right Column: Featured In */}
      <div className="flex shrink-0 flex-col gap-2 px-0 sm:px-8 md:max-w-[700px] md:px-16">
        <span className="text-center text-sm text-blue-600 dark:text-blue-600-dark">
          {t("featuredIn")}
        </span>
        <div className="grid grid-cols-3 items-center gap-x-8 gap-y-4 xl:flex xl:gap-6">
          {FEATURED_IN.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className="flex items-center justify-center transition-opacity hover:opacity-80"
            >
              {item.component}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

const Stat: FC<{ number: string; label: string }> = ({ number, label }) => (
  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-600-dark">
    <span className="font-bold text-blue-800 dark:text-blue-800-dark">
      {number}
    </span>
    <span className="text-nowrap">{label}</span>
  </div>
);

export default WhyMetaculus;
