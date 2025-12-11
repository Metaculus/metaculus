"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import React, { FC, useEffect, useState } from "react";

import cn from "@/utils/core/cn";
import ClientMiscApi from "@/services/api/misc/misc.client";

const FEATURED_IN = [
  {
    href: "https://www.aei.org/",
    src: "https://cdn.metaculus.com/aei-logo.png",
    alt: "AEI",
    width: 40,
    height: 20,
  },
  {
    href: "https://www.bloomberg.com/",
    src: "https://cdn.metaculus.com/bloomberg-logo.png",
    alt: "Bloomberg",
    width: 108,
    height: 20,
  },
  {
    href: "https://www.forbes.com/",
    src: "https://cdn.metaculus.com/forbes-logo.png",
    alt: "Forbes",
    width: 24,
    height: 24,
  },
  {
    href: "https://www.nasdaq.com/",
    src: "https://cdn.metaculus.com/nasdaq-logo.png",
    alt: "Nasdaq",
    width: 70,
    height: 20,
  },
  {
    href: "https://www.theatlantic.com/",
    src: "https://cdn.metaculus.com/the-atlantic-logo.png",
    alt: "The Atlantic",
    width: 24,
    height: 24,
  },
  {
    href: "https://www.economist.com/",
    src: "https://cdn.metaculus.com/the-economist-logo.png",
    alt: "The Economist",
    width: 40,
    height: 20,
  },
];

const fetchSiteStats = async () => {
  try {
    return await ClientMiscApi.getSiteStats();
  } catch (error) {
    console.error(error);
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
        "flex flex-col gap-3 rounded-lg bg-gray-200 px-6 py-5 dark:bg-gray-200-dark md:gap-4 lg:flex-row lg:items-center lg:gap-6",
        className
      )}
    >
      <h2 className="m-0 shrink-0 text-base font-bold text-gray-700 dark:text-gray-700-dark">
        {t("whatsMetaculus")}
      </h2>

      {/* Divider */}
      <div className="h-px w-full bg-gray-300 dark:bg-gray-300-dark lg:h-16 lg:w-px lg:shrink-0" />

      <div className="flex flex-1 flex-col gap-3 md:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* Description & Stats */}
        <div className="flex flex-col gap-3 lg:flex-1">
          <p className="m-0 text-sm font-medium leading-5 text-gray-800 dark:text-gray-800-dark">
            {t("metaculusDescription")}
          </p>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between lg:justify-start lg:gap-8">
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
        <div className="h-px w-full bg-gray-300 dark:bg-gray-300-dark lg:h-16 lg:w-px lg:shrink-0" />

        {/* Featured In */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-700-dark">
            {t("featuredIn")}
          </span>
          <div className="flex flex-wrap items-center gap-6">
            {FEATURED_IN.map((item) => (
              <a
                key={item.alt}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block max-w-[50px] "
                style={{ width: item.width, height: item.height }}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-contain object-left"
                  sizes={`${item.width}px`}
                />
              </a>
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
    <span>{label}</span>
  </div>
);

export default WhyMetaculus;
