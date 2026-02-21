"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, ReactNode } from "react";

import FutureEvalSymbol from "@/app/(futureeval)/futureeval/components/futureeval-symbol";
import { FE_COLORS } from "@/app/(futureeval)/futureeval/theme";
import { useBreakpoint } from "@/hooks/tailwind";
import cn from "@/utils/core/cn";

type HeroCTACardVariant = "blue" | "purple" | "futureEval";

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
  futureEval: {
    bg: "bg-[#469C93]/15 dark:bg-[#23FBE3]/15",
    text: "text-[#474747] dark:text-[#EDF7F3]",
    textLight: FE_COLORS.textAccent,
    hover: "hover:bg-[#469C93]/20 dark:hover:bg-[#23FBE3]/20",
  },
};

type HeroCTACardProps = {
  href: string;
  topTitle: ReactNode;
  subtitle: string;
  variant: HeroCTACardVariant;
  topTitleClassName?: string;
  arrowClassName?: string;
};

const HeroCTACard: FC<PropsWithChildren<HeroCTACardProps>> = ({
  href,
  topTitle,
  subtitle,
  children,
  variant,
  topTitleClassName,
  arrowClassName,
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
        <div
          className={cn(
            "my-0 text-sm font-medium md:text-base",
            textLightClasses,
            topTitleClassName
          )}
        >
          {topTitle}
        </div>
        <FontAwesomeIcon
          icon={faArrowRight}
          className={cn("text-lg", textLightClasses, arrowClassName)}
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
  futureEvalHref?: string;
  className?: string;
};

const HeroCTAs: FC<Props> = ({
  platformHref = "/questions/",
  servicesHref = "/services/",
  futureEvalHref = "/futureeval/",
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
          <div className="ml-4 min-w-0 shrink-0 basis-[80%] md:ml-0 md:basis-[calc((100%-32px)/3)]">
            <HeroCTACard
              href={platformHref}
              topTitle={t("hero1TopTitle")}
              subtitle={t("collectiveForecastsForPublicGood")}
              variant="blue"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-balance text-xs font-bold leading-4 text-blue-800 dark:text-blue-800-dark md:text-sm">
                    {t("followImportantTopics")}
                  </p>
                  <p className="m-0 text-balance text-xs font-medium leading-4 text-blue-700 dark:text-blue-700-dark">
                    {t("followImportantTopicsDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-balance text-xs font-bold leading-4 text-blue-800 dark:text-blue-800-dark md:text-sm">
                    {t("practiceForecasting")}
                  </p>
                  <p className="m-0 text-balance text-xs font-medium leading-4 text-blue-700 dark:text-blue-700-dark">
                    {t("practiceForecastingDescription")}
                  </p>
                </div>
                {/** NOTE: removed when added future eval card
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-blue-800 dark:text-blue-800-dark md:text-sm">
                    {t("cashPrizesForAccuracy")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-blue-700 dark:text-blue-700-dark">
                    {t("cashPrizesForAccuracyDescription")}
                  </p>
                </div>
                 */}
              </div>
            </HeroCTACard>
          </div>

          <div className="min-w-0 shrink-0 basis-[80%] md:basis-[calc((100%-32px)/3)]">
            <HeroCTACard
              href={servicesHref}
              topTitle={t("hero2TopTitle")}
              subtitle={t("partnerWithMetaculus")}
              variant="purple"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-balance text-xs font-bold leading-4 text-purple-800 dark:text-purple-800-dark md:text-sm">
                    {t("hireProForecasters")}
                  </p>
                  <p className="m-0 text-balance text-xs font-medium leading-4 text-purple-700 dark:text-purple-700-dark">
                    {t("hireProForecastersDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-balance text-xs font-bold leading-4 text-purple-800 dark:text-purple-800-dark md:text-sm">
                    {t("launchTournament")}
                  </p>
                  <p className="m-0 text-balance text-xs font-medium leading-4 text-purple-700 dark:text-purple-700-dark">
                    {t("launchTournamentDescription")}
                  </p>
                </div>
                {/** NOTE: removed when added future eval card
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs font-bold leading-4 text-purple-800 dark:text-purple-800-dark md:text-sm">
                    {t("hostPrivateInstances")}
                  </p>
                  <p className="m-0 text-xs font-medium leading-4 text-purple-700 dark:text-purple-700-dark">
                    {t("hostPrivateInstancesDescription")}
                  </p>
                </div>
                */}
              </div>
            </HeroCTACard>
          </div>

          <div className="mr-4 min-w-0 shrink-0 basis-[80%] md:mr-0 md:basis-[calc((100%-32px)/3)]">
            <HeroCTACard
              href={futureEvalHref}
              topTitle={
                <div className="flex items-center gap-3">
                  <FutureEvalSymbol className="h-6 w-auto shrink-0" />
                  <span
                    className={cn(
                      "font-medium text-[#474747] dark:text-[#EDF7F3]"
                    )}
                  >
                    {t("futureEval")}
                  </span>
                </div>
              }
              subtitle={t("futureEvalCardSubtitle")}
              variant="futureEval"
              arrowClassName="opacity-50"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <p
                    className={cn(
                      "m-0 text-balance text-xs font-bold leading-4 md:text-sm",
                      FE_COLORS.textAccent
                    )}
                  >
                    {t("modelLeaderboard")}
                  </p>
                  <p
                    className={cn(
                      "m-0 text-balance text-xs font-medium leading-4"
                    )}
                  >
                    {t("futureEvalCardModelLeaderboardDescriptionShort")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p
                    className={cn(
                      "m-0 text-balance text-xs font-bold leading-4 md:text-sm",
                      FE_COLORS.textAccent
                    )}
                  >
                    {t("futureEvalCardBuildBotTitle")}
                  </p>
                  <p
                    className={cn(
                      "m-0 text-balance text-xs font-medium leading-4"
                    )}
                  >
                    {t("futureEvalCardBuildBotDescription")}
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
