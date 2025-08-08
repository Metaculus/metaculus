import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import { ServiceType } from "@/constants/services";

import Button from "../components/button";
import GetInTouchForm from "../components/get_in_touch_form";
import StepCard from "../components/step_card";
import PlatformBlock from "./components/platform_block";

export const metadata = {
  title: "Create Your Private Forecasting Platform",
  description:
    "Launch your own private forecasting instance with Metaculus. Combine the power of predictive analytics with internal expertise to address key strategic questions within your organization.",
};

export default async function PrivateInstancesPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px] min-[1366px]:pt-[103px]">
      <div className="mx-auto max-w-[880px]">
        <h3 className="m-0 mx-auto max-w-[400px] text-pretty px-2.5 text-center text-[32px] font-bold leading-9 tracking-tight text-blue-800 dark:text-blue-800-dark sm:max-w-[570px] sm:text-5xl lg:px-0">
          {t.rich("createPrivateInstance", {
            span: (chunks) => (
              <span className="text-blue-700 dark:text-blue-700-dark">
                {chunks}
              </span>
            ),
          })}
        </h3>

        <div className="mt-5 flex-col px-2.5 text-center text-sm text-blue-700 dark:text-blue-700-dark sm:px-16 sm:text-[21px] sm:leading-[32px] lg:mt-8 lg:flex lg:px-0">
          <p className="m-0 text-sm font-medium sm:text-xl">
            {t("sinceItsDebutIn2016")}
          </p>
          <br />
          <p className="m-0 text-sm sm:text-lg">
            {t("youCanDeployPrivateInstance")}
          </p>
        </div>

        <Button href="#contact-us" className="mx-auto mt-8 block">
          {t("contactUs")}
        </Button>
      </div>

      <PlatformBlock
        richForecastingInterface={t("captureForecastsAcrossTeams")}
        description={t("advancedForecastingCapabilities")}
        builtInAccuracyTracking={t("forecastPerformanceIsTracked")}
        organizedCollaboration={t("groupForecastsByTeam")}
        decisionRelevantInsights={t("transformRawPredictions")}
      />

      <div className="mt-[100px] text-blue-700 dark:text-blue-700-dark md:mt-[150px] xl:mt-[120px]">
        <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-inherit dark:text-inherit">
          {t("howItWorks")}
        </h3>
        <p className="m-0 mt-3 text-pretty text-center text-xl font-medium">
          {t("stepsForSettingUpPrivateInstance")}
        </p>
        <div className="mt-12 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-[22px]">
          <StepCard
            step={1}
            title={t("contactUs")}
            description={t("letsExplorHowOurSoftware")}
            className="flex-1"
          />
          <FontAwesomeIcon
            icon={faArrowRight}
            className="hidden h-4 self-center text-blue-600 dark:text-blue-600-dark lg:block"
          />
          <StepCard
            step={2}
            title={t("billedAnnuallyOrMonthly")}
            description={t("chooseServiceArrangement")}
            className="flex-1"
          />
          <FontAwesomeIcon
            icon={faArrowRight}
            className="hidden h-4 self-center text-blue-600 dark:text-blue-600-dark lg:block"
          />
          <StepCard
            step={3}
            title={t("deployToYourTeam")}
            description={t("whetherMetaculusHostedOrOnPremises")}
            className="flex-1"
          />
        </div>
      </div>

      <GetInTouchForm
        id="contact-us"
        className="mb-36 mt-10 sm:mt-12 md:mt-16 lg:mt-[120px]"
        preselectedServices={[ServiceType.PRIVATE_INSTANCE]}
        pageLabel="private-instances"
      />
    </main>
  );
}
