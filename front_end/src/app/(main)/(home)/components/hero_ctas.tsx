"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { useBreakpoint } from "@/hooks/tailwind";
import cn from "@/utils/core/cn";

type HeroCTACardVariant = "blue" | "purple";

const variantStyles: Record<
  HeroCTACardVariant,
  { bg: string; text: string; textLight: string; hover: string }
> = {
  blue: {
    bg: "bg-blue-300 dark:bg-blue-300-dark",
    text: "text-blue-800 dark:text-blue-800-dark",
    textLight: "text-blue-700 dark:text-blue-700-dark",
    hover: "hover:bg-blue-400/80 dark:hover:bg-blue-400-dark/70",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-200-dark/70",
    text: "text-purple-800 dark:text-purple-800-dark",
    textLight: "text-purple-700 dark:text-purple-700-dark",
    hover: "hover:bg-purple-300/60 dark:hover:bg-purple-300-dark/60",
  },
};

type HeroCTACardProps = {
  href: string;
  topTitle: string;
  subtitle: string;
  variant: HeroCTACardVariant;
};

const HeroCTACard: FC<PropsWithChildren<HeroCTACardProps>> = ({
  href,
  topTitle,
  subtitle,
  children,
  variant,
}) => {
  const {
    bg: bgColorClasses,
    text: textColorClasses,
    textLight: textLightClasses,
    hover: hoverClasses,
  } = variantStyles[variant];

  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full shrink-0 flex-col justify-between overflow-hidden rounded-lg p-6 no-underline transition-colors",
        bgColorClasses,
        textColorClasses,
        hoverClasses
      )}
    >
      <div className="flex items-start justify-between">
        <p
          className={cn(
            "my-0 text-sm font-medium md:text-base",
            textLightClasses
          )}
        >
          {topTitle}
        </p>
        <FontAwesomeIcon
          icon={faArrowRight}
          className={cn("text-lg", textLightClasses)}
        />
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <h3
          className={cn(
            "m-0 mt-4 text-lg font-bold leading-6 md:text-2xl md:leading-8",
            textColorClasses
          )}
        >
          {subtitle}
        </h3>
        <div className="mt-6">{children}</div>
      </div>
    </Link>
  );
};

type Props = {
  platformHref?: string;
  servicesHref?: string;
  className?: string;
};

const HeroCTAs: FC<Props> = ({
  platformHref = "/questions/",
  servicesHref = "/services/",
  className,
}) => {
  const t = useTranslations();
  const isMdScreen = useBreakpoint("md");
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    watchDrag: !isMdScreen,
  });

  return (
    <section className={cn("w-full", className)}>
      <div ref={emblaRef} className="overflow-x-scroll no-scrollbar">
        <div className="flex gap-3 md:gap-4">
          <div className="ml-4 min-w-0 shrink-0 basis-[80%] md:ml-0 md:basis-[calc(50%-8px)]">
            <HeroCTACard
              href={platformHref}
              topTitle={t("hero1TopTitle")}
              subtitle={t("collectiveForecastsForPublicGood")}
              variant="blue"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-blue-800 dark:text-blue-800-dark md:text-sm">
                    {t("followImportantTopics")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-blue-700 dark:text-blue-700-dark">
                    {t("followImportantTopicsDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-blue-800 dark:text-blue-800-dark md:text-sm">
                    {t("practiceForecasting")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-blue-700 dark:text-blue-700-dark">
                    {t("practiceForecastingDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-blue-800 dark:text-blue-800-dark md:text-sm">
                    {t("cashPrizesForAccuracy")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-blue-700 dark:text-blue-700-dark md:text-sm">
                    {t("cashPrizesForAccuracyDescription")}
                  </p>
                </div>
              </div>
            </HeroCTACard>
          </div>

          <div className="mr-4 min-w-0 shrink-0 basis-[80%] md:mr-0 md:basis-[calc(50%-8px)]">
            <HeroCTACard
              href={servicesHref}
              topTitle={t("hero2TopTitle")}
              subtitle={t("partnerWithMetaculus")}
              variant="purple"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-purple-800 dark:text-purple-800-dark md:text-sm">
                    {t("hireProForecasters")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-purple-700 dark:text-purple-700-dark">
                    {t("hireProForecastersDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-purple-800 dark:text-purple-800-dark md:text-sm">
                    {t("launchTournament")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-purple-700 dark:text-purple-700-dark">
                    {t("launchTournamentDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-purple-800 dark:text-purple-800-dark md:text-sm">
                    {t("hostPrivateInstances")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-purple-700 dark:text-purple-700-dark">
                    {t("hostPrivateInstancesDescription")}
                  </p>
                </div>
              </div>
            </HeroCTACard>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCTAs;
