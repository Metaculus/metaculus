import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import { ServiceType } from "@/constants/services";
import { TournamentPreview } from "@/types/projects";

import Button from "../../components/button";
import StepCard from "../../components/step_card";
import OtherTournaments from "../../tournaments/components/other_tournaments";
import TournamentSpotlight from "../../tournaments/components/tournament_spotlight";
import ContactSection from "../contact_section/contact_section";

type Props = {
  spotlightTournament: TournamentPreview | undefined;
  spotlightTournamentDescription: string;
  tournaments: TournamentPreview[];
  launchTournament: React.ReactNode;
  description: {
    firstPart: string;
    secondPart: string;
  };
  stepsDescription: string;
  steps: {
    title: string;
    description: string;
    titleClassName?: string;
  }[];
};

const TournamentsPageTemplate: React.FC<Props> = async ({
  spotlightTournament,
  spotlightTournamentDescription,
  tournaments,
  launchTournament,
  description,
  stepsDescription,
  steps,
}) => {
  const t = await getTranslations();

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px] min-[1366px]:pt-[103px]">
        <div>
          <h3 className="m-0 mx-auto max-w-[448px] text-balance px-6 text-center text-[32px] font-bold leading-9 tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-5xl md:max-w-[576px] lg:max-w-full lg:px-0">
            {launchTournament}
          </h3>

          <div className="mx-auto mt-5 max-w-[880px] flex-col px-6 text-center text-sm text-blue-700 dark:text-blue-700-dark sm:px-16 sm:text-[21px] sm:leading-[32px] lg:mt-8 lg:flex lg:px-0">
            <p className="m-0 text-pretty text-blue-700 dark:text-blue-700-dark lg:hidden">
              {description.firstPart} {description.secondPart}
            </p>
            <div className="hidden lg:block">
              <p className="m-0 text-xl font-medium">{description.firstPart}</p>
              <br />
              <p className="m-0 text-lg">{description.secondPart}</p>
            </div>
          </div>

          <Button href="#contact-us" className="mx-auto mt-8 block">
            {t("contactUs")}
          </Button>
        </div>

        <div className="mt-10 text-blue-700 dark:text-blue-700-dark sm:mt-16 lg:mt-[120px]">
          <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-inherit dark:text-inherit">
            {t("howItWorks")}
          </h3>
          <p className="m-0 mt-3 text-center text-xl font-medium">
            {stepsDescription}
          </p>
          <div className="mt-12 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-[22px]">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <StepCard
                  step={idx + 1}
                  title={step.title}
                  description={step.description}
                  className="flex-1"
                  titleClassName={step.titleClassName}
                />
                {idx < steps.length - 1 && (
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="hidden h-4 self-center text-blue-600 dark:text-blue-600-dark lg:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        {spotlightTournament && (
          <TournamentSpotlight
            tournament={spotlightTournament}
            className="mt-10 sm:mt-16 lg:mt-[120px]"
            tournamentDescription={spotlightTournamentDescription}
          />
        )}

        <OtherTournaments tournaments={tournaments} />
      </main>
      <ContactSection
        id="contact-us"
        className="mt-10 sm:mt-12 md:mt-16 lg:mt-[120px]"
        pageLabel="tournaments"
        preselectedService={ServiceType.RUNNING_TOURNAMENT}
      />
    </>
  );
};

export default TournamentsPageTemplate;
