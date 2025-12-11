import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type HeroCTACardProps = {
  href: string;
  topTitle: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  buttonText: string;
  bgColorClasses: string;
  textColorClasses: string;
  buttonClassName: string;
};

const HeroCTACard: FC<PropsWithChildren<HeroCTACardProps>> = ({
  href,
  topTitle,
  imageSrc,
  imageAlt,
  title,
  children,
  buttonText,
  bgColorClasses,
  textColorClasses,
  buttonClassName,
}) => {
  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col justify-between overflow-hidden rounded-lg p-6",
        bgColorClasses,
        textColorClasses,
        "w-[80%] sm:flex-1"
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
};

const HeroCTAs: FC<Props> = ({
  individualsHref = "/questions/",
  businessesHref = "/services/",
}) => {
  const t = useTranslations();
  return (
    <section className="flex w-full gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <HeroCTACard
        href={individualsHref}
        topTitle={t("forIndividuals")}
        imageSrc="/images/pie-chart.png"
        imageAlt="Pie chart"
        title={t("heroIndividualsTitle")}
        buttonText={t("exploreQuestions")}
        bgColorClasses="bg-blue-300 dark:bg-blue-300-dark"
        textColorClasses="text-blue-800 dark:text-blue-800-dark"
        buttonClassName="border-blue-500 bg-gray-0 text-blue-700 hover:border-blue-600 hover:bg-blue-100 dark:border-blue-500-dark dark:bg-gray-0-dark dark:text-blue-700-dark dark:hover:border-blue-600-dark dark:hover:bg-blue-100-dark"
      >
        <p className="m-0 mt-3 text-sm font-medium leading-4 text-blue-800 dark:text-blue-800-dark ">
          {t("heroIndividualsDescription")}
        </p>
      </HeroCTACard>

      <HeroCTACard
        href={businessesHref}
        topTitle={t("forBusinesses")}
        imageSrc="/images/puzzle.png"
        imageAlt="Puzzle"
        title={t("partnerWithMetaculus")}
        buttonText={t("learnMore")}
        bgColorClasses="bg-purple-100 dark:bg-purple-100-dark"
        textColorClasses="text-purple-800 dark:text-purple-800-dark"
        buttonClassName="border-purple-200 bg-purple-200 text-purple-700 hover:border-purple-300 hover:bg-purple-300 dark:border-purple-200-dark dark:bg-purple-200-dark dark:text-purple-700-dark dark:hover:border-purple-300-dark dark:hover:bg-purple-300-dark"
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
    </section>
  );
};

export default HeroCTAs;
