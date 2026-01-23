import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import { ServiceType } from "@/constants/services";

import PlatformBlock from "../../private-instances/components/platform_block";
import Button from "../button";
import ContactSection from "../contact_section/contact_section";
import StepCard from "../step_card";

type Props = {
  title: React.ReactNode;
  sinceDebut: string;
  deployedDescription?: string;
  platformBlock: {
    description: string;
    richForecastingInterface: string;
    builtInAccuracyTracking: string;
    organizedCollaboration: string;
    decisionRelevantInsights: string;
  };
  stepsDescription?: string;
  steps: {
    title: string;
    description: string;
    titleClassName?: string;
  }[];
};

const PrivateInstancesPageTemplate: React.FC<Props> = async ({
  title,
  sinceDebut,
  deployedDescription,
  platformBlock,
  stepsDescription,
  steps,
}) => {
  const t = await getTranslations();

  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px] min-[1366px]:pt-[103px]">
        <div className="mx-auto max-w-[880px]">
          <h3 className="m-0 mx-auto max-w-[400px] text-pretty px-2.5 text-center text-[32px] font-bold leading-9 tracking-tight text-blue-800 dark:text-blue-800-dark sm:max-w-[570px] sm:text-5xl lg:px-0">
            {title}
          </h3>

          <div className="mt-5 flex-col px-2.5 text-center text-sm text-blue-700 dark:text-blue-700-dark sm:px-16 sm:text-[21px] sm:leading-[32px] lg:mt-8 lg:flex lg:px-0">
            <p className="m-0 text-sm font-medium sm:text-xl">{sinceDebut}</p>
            <br />
            <p className="m-0 text-sm sm:text-lg">{deployedDescription}</p>
          </div>

          <Button href="#contact-us" className="mx-auto mt-8 block">
            {t("contactUs")}
          </Button>
        </div>

        <PlatformBlock
          richForecastingInterface={platformBlock.richForecastingInterface}
          description={platformBlock.description}
          builtInAccuracyTracking={platformBlock.builtInAccuracyTracking}
          organizedCollaboration={platformBlock.organizedCollaboration}
          decisionRelevantInsights={platformBlock.decisionRelevantInsights}
        />

        <div className="mt-[100px] text-blue-700 dark:text-blue-700-dark md:mt-[150px] xl:mt-[120px]">
          <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-inherit dark:text-inherit">
            {t("howItWorks")}
          </h3>
          <p className="m-0 mt-3 text-pretty text-center text-xl font-medium">
            {stepsDescription}
          </p>

          <div className="mt-12 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-[22px]">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-1 items-center gap-4">
                <StepCard
                  step={idx + 1}
                  title={step.title}
                  description={step.description}
                  className="h-full flex-1"
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
      </main>
      <ContactSection
        className="mt-10 sm:mt-12 md:mt-16 lg:mt-[120px]"
        id="contact-us"
        pageLabel="private-instances"
        preselectedService={ServiceType.PRIVATE_INSTANCE}
      />
    </>
  );
};

export default PrivateInstancesPageTemplate;
