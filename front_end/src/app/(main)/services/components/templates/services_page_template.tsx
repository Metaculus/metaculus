import Image from "next/image";
import { getTranslations } from "next-intl/server";

import serverMiscApi from "@/services/api/misc/misc.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

import DesktopImage from "../../assets/desktop.webp";
import PhoneImage from "../../assets/phone.webp";
import WorkshopImage from "../../assets/workshop.svg?url";
import { sortServiceTournaments } from "../../helpers";
import ServiceConfig from "../../serviceConfig";
import Button from "../button";
import CaseStudyCard from "../case_studies/case_study_card";
import { TCaseStudyCard } from "../case_studies/types";
import ContactSection from "../contact_section/contact_section";
import HeadingBlock from "../heading_block";
import PartnersCarousel from "../partners_carousel";
import SectionHeading from "../section_heading";
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
  caseStudies?: {
    title: string;
    description?: string;
    cards: TCaseStudyCard[];
  };
  privateInstances: { title: string; description: string };
  proForecasters: { title: string; firstPart: string; secondPart: string };
  workshop?: {
    title: string;
    description: string;
    href?: string;
  };
  vertical?: "financial-services";
};

const ServicesPageTemplate: React.FC<Props> = async ({
  heading: { statsList, overview, purpose },
  solutions,
  tournaments,
  caseStudies,
  privateInstances,
  proForecasters,
  workshop,
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
    <>
      <main className="mx-auto box-content flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px]">
        <HeadingBlock
          statsList={finalStatsList}
          overview={overview}
          purpose={purpose}
        />
        <PartnersCarousel className="my-10 sm:my-12 lg:my-32" />

        <SectionHeading
          title={solutions.title}
          subtitle={solutions.description}
        />

        <TournamentBlock
          className="mt-12"
          title={tournaments.title}
          description={tournaments.description}
          data={tournamentsData}
          learnMoreHref={`${base}/tournaments`}
        />

        <div className="mt-4 flex flex-col gap-4 sm:mt-8 sm:gap-8 lg:flex-row">
          <div className="flex w-full flex-col items-center rounded-2xl bg-blue-800 p-8 sm:items-start sm:p-[64px]">
            <div className="relative w-full max-w-[560px]">
              <Image
                src={DesktopImage}
                alt="Metaculus on desktop"
                unoptimized
                className="h-auto w-full"
              />
              <Image
                src={PhoneImage}
                alt="Metaculus on mobile"
                unoptimized
                className="absolute bottom-0 right-0 h-auto w-[30%] translate-x-[10%] translate-y-[6%]"
              />
            </div>
            <h3 className="m-0 mt-[38px] text-2xl font-bold tracking-tight text-blue-200 sm:text-start sm:text-3xl">
              {privateInstances.title}
            </h3>
            <p className="m-0 mt-5 text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
              {privateInstances.description}
            </p>
            <Button
              href={`${base}/private-instances`}
              className="mt-[38px] uppercase"
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

        {workshop && (
          <div className="mt-4 sm:mt-8">
            <div className="flex flex-col gap-8 rounded-2xl bg-blue-800 p-8 sm:p-[64px] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center sm:items-start">
                <h3 className="m-0 text-2xl font-bold tracking-tight text-blue-200 sm:text-3xl">
                  {workshop.title}
                </h3>

                <p className="m-0 mt-5 max-w-[560px] text-center text-sm font-normal text-blue-500 sm:text-start sm:text-lg sm:font-medium">
                  {workshop.description}
                </p>

                <div className="mt-8 flex flex-col items-center gap-8 sm:items-start lg:mt-0">
                  <div className="order-1 flex w-full items-center justify-center lg:order-2 lg:hidden lg:w-auto lg:shrink-0">
                    <Image
                      src={WorkshopImage}
                      alt="Workshop illustration"
                      unoptimized
                      className="h-auto w-full max-w-[420px]"
                    />
                  </div>

                  <Button
                    href="#contact-us"
                    className="order-2 mt-0 w-fit uppercase lg:order-1 lg:mt-[38px]"
                  >
                    {t("contactUs")}
                  </Button>
                </div>
              </div>

              <div className="hidden lg:flex lg:w-auto lg:shrink-0 lg:items-center lg:justify-center">
                <Image
                  src={WorkshopImage}
                  alt="Workshop illustration"
                  unoptimized
                  className="h-auto w-full max-w-[420px]"
                />
              </div>
            </div>
          </div>
        )}

        {caseStudies && (
          <div className="mt-12 lg:mt-32">
            <SectionHeading
              title={caseStudies.title}
              subtitle={caseStudies.description}
            />

            <div className="mt-8 grid gap-6">
              {caseStudies.cards.map((card) => (
                <CaseStudyCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        )}
      </main>

      <ContactSection
        id="contact-us"
        className="mt-10 sm:mt-12 lg:mt-32"
        pageLabel="services"
      />
    </>
  );
};

export default ServicesPageTemplate;
