import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import CaseStudyCard from "../components/case_study_card";
import GetInTouchForm from "../components/get_in_touch_form";
import StepCard from "../components/step_card";

// TODO: adjust metadata
export const metadata = {
  title: "Private Instances Metaculus",
  description:
    "Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.",
};

export default async function PrivateInstancesPage() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px] min-[1366px]:pt-[103px]">
      <div>
        <h3 className="m-0 mx-auto max-w-[448px] text-balance px-6 text-center text-[32px] font-bold leading-9 tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-5xl md:max-w-[576px] lg:max-w-full lg:px-0 lg:text-start">
          {t.rich("createPrivateInstance", {
            span: (chunks) => (
              <span className="text-blue-700 dark:text-blue-700-dark">
                {chunks}
              </span>
            ),
          })}
        </h3>

        <div className="mt-5 flex-col px-6 text-center text-sm text-blue-700 dark:text-blue-700-dark sm:px-16 sm:text-[21px] sm:leading-[32px] lg:mt-8 lg:flex lg:px-0 lg:text-start">
          {/* Mobile paragraph */}
          <p className="m-0 text-pretty text-blue-700 dark:text-blue-700-dark lg:hidden">
            {t("sinceItsDebutIn2016")} {t("youCanDeployProForecasters")}
          </p>
          {/* Desktop paragraphs */}
          <div className="hidden lg:block">
            <p className="m-0 text-xl font-medium">
              {t("sinceItsDebutIn2016")}
            </p>
            <br />
            <p className="m-0 text-lg">{t("youCanDeployProForecasters")}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-blue-700 dark:text-blue-700-dark sm:mt-16 lg:mt-[120px]">
        <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-inherit dark:text-inherit">
          {t("howItWorks")}
        </h3>
        <p className="m-0 mt-3 text-center text-xl font-medium">
          {t("stepsForSettingUpTournament")}
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
            title={t("payAnnuallyOrMonthly")}
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

      <CaseStudyCard
        title={t("organizationsLikeCzechPriorities")}
        className="mt-[120px]"
      >
        <p className="m-0">{t("sinceItsDebutIn2016")}</p>
        <br />
        <p className="m-0">{t("youCanDeployMetaculusCodebase")}</p>
      </CaseStudyCard>

      <GetInTouchForm className="mb-36 mt-10 sm:mt-12 md:mt-16 lg:mt-[120px]" />
    </main>
  );
}
