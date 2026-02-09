import Image from "next/image";
import { getTranslations } from "next-intl/server";

import serverMiscApi from "@/services/api/misc/misc.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

import DevicesImage from "../../assets/devices.svg?url";
import { sortServiceTournaments } from "../../helpers";
import ServiceConfig from "../../serviceConfig";
import Button from "../button";
import GetInTouchForm from "../get_in_touch_form";
import HeadingBlock from "../heading_block";
import PartnersCarousel from "../partners_carousel";
import TournamentBlock from "../tournament_block";

type Props = {
  heading: {
    statsList?: { label: string; value: string }[];
    overview: string;
    purpose?: string;
  };
  solutions: { title: string; description: string };
  tournaments: {
    title: string;
    description: string;
    data?: TournamentPreview[];
  };
  privateInstances: { title: string; description: string };
  proForecasters: { title: string; firstPart: string; secondPart: string };
  vertical?: "financial-services";
};

const ServicesPageTemplate: React.FC<Props> = async ({
  heading: { statsList, overview, purpose },
  solutions,
  tournaments,
  privateInstances,
  proForecasters,
  vertical,
}) => {
  const t = await getTranslations();

  const base =
    vertical === "financial-services"
      ? "/services/financial-services"
      : "/services";

  let finalStatsList = statsList;
  if (!finalStatsList) {
    try {
      const siteStats = await serverMiscApi.getSiteStats();
      finalStatsList = [
        {
          label: t("predictions"),
          value: `${abbreviatedNumber(siteStats.predictions)}+`,
        },
        {
          label: t("forecastingQuestions"),
          value: `${abbreviatedNumber(siteStats.questions)}+`,
        },
        {
          label: t("questionsResolved"),
          value: `${abbreviatedNumber(siteStats.resolved_questions)}+`,
        },
        {
          label: `${t("years")} ${t("ofPredictions")}`,
          value: `${siteStats.years_of_predictions}`,
        },
      ];
    } catch {
      finalStatsList = [];
    }
  }

  let tournamentsData = tournaments.data;
  if (!tournamentsData) {
    try {
      const { mainPageTournamentsList } = ServiceConfig;
      const all = await ServerProjectsApi.getTournaments({
        show_on_services_page: true,
      });
      const curated = all.filter(({ id, slug }) =>
        mainPageTournamentsList.some(
          ({ id: want }) => String(want) === slug || want === id
        )
      );
      tournamentsData = sortServiceTournaments(curated);
    } catch {
      tournamentsData = [];
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px]">
      <HeadingBlock
        statsList={finalStatsList}
        overview={overview}
        purpose={purpose}
      />
      <PartnersCarousel className="my-10 sm:my-12 lg:my-32" />

      <div className="flex flex-col items-center gap-3 px-4 text-center">
        <h3 className="m-0 text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark">
          {solutions.title}
        </h3>
        <p className="m-0 text-pretty text-xl font-medium text-blue-700 dark:text-blue-700-dark">
          {solutions.description}
        </p>
      </div>

      <TournamentBlock
        className="mt-12"
        title={tournaments.title}
        description={tournaments.description}
        data={tournamentsData}
        learnMoreHref={`${base}/tournaments`}
      />

      <div className="mt-4 flex flex-col gap-4 sm:mt-8 sm:gap-8 lg:flex-row">
        <div className="flex w-full flex-col items-center rounded-2xl bg-blue-800 p-8 sm:items-start sm:p-[64px]">
          <Image
            src={DevicesImage}
            alt="Devices image"
            unoptimized
            className="h-auto w-full"
          />
          <h3 className="m-0 mt-[38px] text-2xl font-bold tracking-tight text-blue-200 sm:text-start sm:text-3xl">
            {privateInstances.title}
          </h3>
          <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
            {privateInstances.description}
          </p>
          <Button
            href={`${base}/private-instances`}
            className="mt-[38px] uppercase lg:mt-auto"
          >
            {t("learnMore")}
          </Button>
        </div>

        <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-blue-800 p-8 sm:items-start sm:p-[64px]">
          <div className="flex flex-row">
            {ServiceConfig.proForecastersImages.map((image, index) => (
              <div
                key={index}
                className={cn(
                  "box-content h-[62px] w-[62px] overflow-hidden rounded-full border-4 border-blue-800 sm:h-[80px] sm:w-[80px] lg:h-[67px] lg:w-[67px]",
                  { "-ml-[25px]": index !== 0 }
                )}
              >
                {index === ServiceConfig.proForecastersImages.length - 1 ? (
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
            {proForecasters.title}
          </h3>
          <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
            {proForecasters.firstPart}
          </p>
          <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
            {proForecasters.secondPart}
          </p>
          <Button
            href={`${base}/pro-forecasters`}
            className="mt-[38px] uppercase"
          >
            {t("learnMore")}
          </Button>
        </div>
      </div>

      <GetInTouchForm
        id="contact-us"
        className="mb-36 mt-10 sm:mt-12 lg:mt-32"
        pageLabel="services"
      />
    </main>
  );
};

export default ServicesPageTemplate;
