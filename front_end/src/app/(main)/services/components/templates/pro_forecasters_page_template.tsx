import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import { ServiceType } from "@/constants/services";

import CaseStudyCard from "../../pro-forecasters/components/case_study_card";
import ProForecastersBlock from "../../pro-forecasters/components/pro_forecasters_block";
import Button from "../button";
import { ServiceOption } from "../contact_section/contact_form";
import ContactSection from "../contact_section/contact_section";
import StepCard from "../step_card";

type Props = {
  title: React.ReactNode;
  description: {
    firstPart: string;
    secondPart: string;
  };
  howItWorksDescription: string;
  steps: {
    title: string;
    description: string;
    titleClassName?: string;
  }[];
  caseStudy: {
    title: string;
    description: {
      firstPart: React.ReactNode;
      secondPart: React.ReactNode;
    };
  };
  serviceOptions?: ServiceOption[];
};

const ProForecastersPageTemplate: React.FC<Props> = async ({
  title,
  description,
  howItWorksDescription,
  steps,
  caseStudy,
  serviceOptions,
}) => {
  const t = await getTranslations();
  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px] min-[1366px]:pt-[103px]">
        <div>
          <h3 className="m-0 mx-auto max-w-[448px] text-balance px-6 text-center text-[32px] font-bold leading-9 tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-5xl md:max-w-[576px] lg:max-w-full lg:px-0">
            {title}
          </h3>

          <div className="mt-5 flex-col px-6 text-center text-sm text-blue-700 dark:text-blue-700-dark sm:px-16 sm:text-[21px] sm:leading-[32px] lg:mt-8 lg:flex lg:px-0">
            {/* Mobile paragraph */}
            <p className="m-0 text-pretty text-blue-700 dark:text-blue-700-dark lg:hidden">
              {description.firstPart} {description.secondPart}
            </p>
            {/* Desktop paragraphs */}
            <div className="hidden lg:block ">
              <p className="m-0 mx-auto max-w-[1000px] text-xl font-medium">
                {description.firstPart}
              </p>
              <br />
              <p className="m-0 mx-auto max-w-[800px] text-pretty text-lg">
                {description.secondPart}
              </p>
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
            {howItWorksDescription}
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

        <CaseStudyCard {...caseStudy} />

        <ProForecastersBlock className="mt-10 sm:mt-16 lg:mt-[120px]" />
      </main>
      <ContactSection
        id="contact-us"
        className="mt-10 sm:mt-12 md:mt-16 lg:mt-[120px]"
        pageLabel="pro-forecasters"
        preselectedService={ServiceType.PRO_FORECASTING}
        serviceOptions={serviceOptions}
      />
    </>
  );
};

export default ProForecastersPageTemplate;
