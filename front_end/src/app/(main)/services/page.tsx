import Image from "next/image";
import { getTranslations } from "next-intl/server";

import ServerProjectsApi from "@/services/api/projects/projects.server";
import { Tournament } from "@/types/projects";
import cn from "@/utils/core/cn";

import DevicesImage from "./assets/devices.svg";
import Button from "./components/button";
import GetInTouchForm from "./components/get_in_touch_form";
import HeadingBlock from "./components/heading_block";
import PartnersCarousel from "./components/partners_carousel";
import TournamentBlock from "./components/tournament_block";
import ServiceConfig from "./serviceConfig.json";

export const metadata = {
  title: "Partner with Metaculus",
  description:
    "Discover how your organization can collaborate with Metaculus to improve strategic decision-making through forecasting. Explore our solutions for quantifying risk, identifying top talent, and enabling internal forecasting.",
};

export default async function ServicesPage() {
  const t = await getTranslations();
  const { proForecastersImages, tournamentsIds } = ServiceConfig;
  // TODO: replace with new API call
  const tournaments = await Promise.all(
    tournamentsIds.map((id) => ServerProjectsApi.getTournament(id))
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8  sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px]">
      <HeadingBlock />
      <PartnersCarousel className="my-10 sm:my-12 lg:my-32" />

      <div className="flex flex-col items-center gap-3 px-4 text-center">
        <h3 className="m-0 text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark">
          {t("solutions")}
        </h3>
        <p className="m-0 text-pretty text-xl font-medium text-blue-700 dark:text-blue-700-dark">
          {t("learnAboutPotentialWays")}
        </p>
      </div>
      {/* TODO: adjust check after new API integration */}
      {tournaments.every((tournament) => tournament !== null) && (
        <TournamentBlock
          className="mt-12"
          tournaments={tournaments as Tournament[]}
        />
      )}
      <div className="mt-4 flex flex-col gap-4 sm:mt-8 sm:gap-8 lg:flex-row">
        {/* Private instances block */}
        <div className="flex w-full flex-col items-center rounded-2xl  bg-blue-800 p-8 sm:items-start  sm:p-[64px]">
          <Image
            src={DevicesImage}
            alt="Devices image"
            unoptimized
            className="h-auto w-full"
          />
          <h3 className="m-0 mt-[38px] text-2xl font-bold tracking-tight text-blue-200 sm:text-start sm:text-3xl">
            {t("privateInstances")}
          </h3>
          <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
            {t("youCanDeployMetaculusCodebase")}
          </p>
          <Button
            href="/services/private-instances"
            className="mt-[38px] uppercase lg:mt-auto"
          >
            {t("learnMore")}
          </Button>
        </div>
        {/* Pro forecasters block */}
        <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-blue-800 p-8 sm:items-start sm:p-[64px]">
          <div className="flex flex-row">
            {proForecastersImages.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "box-content h-[62px] w-[62px] overflow-hidden rounded-full border-4 border-blue-800 sm:h-[80px] sm:w-[80px] lg:h-[67px] lg:w-[67px]",
                  {
                    "-ml-[25px]": index !== 0,
                  }
                )}
              >
                {index === proForecastersImages.length - 1 ? (
                  <div className="flex h-full w-full items-center justify-center bg-blue-700 text-[26px] tracking-widest text-blue-500 sm:text-[34px] lg:text-[29px]">
                    <span className="flex font-bold leading-none">···</span>
                  </div>
                ) : (
                  <Image
                    src={image}
                    alt="Pro forecaster"
                    unoptimized
                    width={80}
                    height={80}
                    className="h-auto w-full"
                    style={{ zIndex: index + 1 }}
                  />
                )}
              </div>
            ))}
          </div>
          <h3 className="m-0 mt-[38px] text-2xl font-bold tracking-tight text-blue-200 sm:text-start sm:text-3xl">
            {t("proForecasters")}
          </h3>
          <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
            {t("youCanDeployProForecasters")}
          </p>
          <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
            {t("proForecastersProvideNotOnly")}
          </p>
          <Button
            href="/services/pro-forecasters"
            className="mt-[38px] uppercase"
          >
            {t("learnMore")}
          </Button>
        </div>
      </div>

      <GetInTouchForm
        id="contact-us"
        className="mb-36 mt-10 sm:mt-12 lg:mt-32"
      />
    </main>
  );
}
