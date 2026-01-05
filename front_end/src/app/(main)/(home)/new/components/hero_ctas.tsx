"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import Button from "@/components/ui/button";
import { useBreakpoint } from "@/hooks/tailwind";
import cn from "@/utils/core/cn";

type HeroCTACardVariant = "blue" | "purple";

const variantStyles: Record<
  HeroCTACardVariant,
  { bg: string; text: string; button: string }
> = {
  blue: {
    bg: "bg-blue-300 dark:bg-blue-300-dark",
    text: "text-blue-800 dark:text-blue-800-dark",
    button:
      "border-blue-500 bg-gray-0 text-blue-700 hover:border-blue-600 hover:bg-blue-100 dark:border-blue-500-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:border-blue-600-dark dark:hover:bg-blue-100-dark",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-100-dark",
    text: "text-purple-800 dark:text-purple-800-dark",
    button:
      "border-purple-200 bg-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-300 dark:border-purple-200-dark dark:bg-purple-200-dark dark:text-purple-700-dark dark:hover:border-purple-300-dark dark:hover:bg-purple-300-dark",
  },
};

type HeroCTACardProps = {
  href: string;
  topTitle: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  buttonText: string;
  variant: HeroCTACardVariant;
};

const HeroCTACard: FC<PropsWithChildren<HeroCTACardProps>> = ({
  href,
  topTitle,
  imageSrc,
  imageAlt,
  title,
  children,
  buttonText,
  variant,
}) => {
  const {
    bg: bgColorClasses,
    text: textColorClasses,
    button: buttonClassName,
  } = variantStyles[variant];
  return (
    <div
      className={cn(
        "relative flex h-full shrink-0 flex-col justify-between overflow-hidden rounded-lg p-6",
        bgColorClasses,
        textColorClasses
      )}
    >
      <div className="absolute right-3 top-3 z-0 size-32 opacity-60">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={120}
          height={120}
          className="h-full w-full object-contain object-center"
        />
      </div>

      <p className={cn("mb-0 text-sm font-medium leading-4", textColorClasses)}>
        {topTitle}
      </p>
      <div className="mt-16 flex flex-col gap-6">
        <div className="flex flex-col">
          <h3
            className={cn(
              "m-0 text-xl font-bold leading-7 md:text-2xl md:leading-8 lg:max-w-[66%]",
              textColorClasses
            )}
          >
            {title}
          </h3>
          <div>{children}</div>
        </div>
      </div>
      <Link href={href}>
        <Button
          variant="secondary"
          size="sm"
          className={cn("mt-6 w-fit rounded-md capitalize", buttonClassName)}
        >
          {buttonText}
        </Button>
      </Link>
    </div>
  );
};

type Props = {
  individualsHref?: string;
  businessesHref?: string;
  className?: string;
};

const HeroCTAs: FC<Props> = ({
  individualsHref = "/questions/",
  businessesHref = "/services/",
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
        <div className="flex gap-4 md:gap-4">
          <div className="ml-4 min-w-0 shrink-0 basis-[80%] md:ml-0 md:basis-[calc(50%-8px)]">
            <HeroCTACard
              href={individualsHref}
              topTitle={t("hero1TopTitle")}
              imageSrc="/images/pie-chart.png"
              imageAlt="Pie chart"
              title={t("heroIndividualsTitle")}
              buttonText={t("exploreQuestions")}
              variant="blue"
            >
              <p className="m-0 mt-3 text-sm font-medium leading-4 text-blue-800 dark:text-blue-800-dark ">
                {t("heroIndividualsDescription")}
              </p>
            </HeroCTACard>
          </div>

          <div className="mr-4 min-w-0 shrink-0 basis-[80%] md:mr-0 md:basis-[calc(50%-8px)]">
            <HeroCTACard
              href={businessesHref}
              topTitle={t("hero2TopTitle")}
              imageSrc="/images/puzzle.png"
              imageAlt="Puzzle"
              title={t("partnerWithMetaculus")}
              buttonText={t("learnMore")}
              variant="purple"
            >
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-bold leading-4 text-purple-800 dark:text-purple-800-dark">
                    {t("hireProForecasters")}
                  </p>
                  <p className="m-0 text-sm font-medium leading-4 text-purple-800 dark:text-purple-800-dark">
                    {t("hireProForecastersDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-bold leading-4 text-purple-800 dark:text-purple-800-dark">
                    {t("launchTournament")}
                  </p>
                  <p className="m-0 text-sm font-medium leading-4 text-purple-800 dark:text-purple-800-dark">
                    {t("launchTournamentDescription")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-sm font-bold leading-4 text-purple-800 dark:text-purple-800-dark">
                    {t("hostPrivateInstances")}
                  </p>
                  <p className="m-0 text-sm font-medium leading-4 text-purple-800 dark:text-purple-800-dark">
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
