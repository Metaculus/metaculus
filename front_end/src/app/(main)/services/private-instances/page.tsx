import { getTranslations } from "next-intl/server";

import PrivateInstancesPageTemplate from "../components/templates/private_instances_page_template";

export const metadata = {
  title: "Create Your Private Forecasting Platform",
  description:
    "Launch your own private forecasting instance with Metaculus. Combine the power of predictive analytics with internal expertise to address key strategic questions within your organization.",
};

export default async function PrivateInstancesPage() {
  const t = await getTranslations();

  return (
    <PrivateInstancesPageTemplate
      title={t.rich("createPrivateInstance", {
        span: (chunks) => (
          <span className="text-blue-700 dark:text-blue-700-dark">
            {chunks}
          </span>
        ),
      })}
      sinceDebut={t("sinceItsDebutIn2016")}
      deployedDescription={t("youCanDeployPrivateInstance")}
      platformBlock={{
        description: t("advancedForecastingCapabilities"),
        richForecastingInterface: t("captureForecastsAcrossTeams"),
        builtInAccuracyTracking: t("forecastPerformanceIsTracked"),
        organizedCollaboration: t("groupForecastsByTeam"),
        decisionRelevantInsights: t("transformRawPredictions"),
      }}
      stepsDescription={t("stepsForSettingUpPrivateInstance")}
      steps={[
        {
          title: t("contactUs"),
          description: t("letsExplorHowOurSoftware"),
          titleClassName: "lg:pr-10",
        },
        {
          title: t("billedAnnuallyOrMonthly"),
          description: t("chooseServiceArrangement"),
        },
        {
          title: t("deployToYourTeam"),
          description: t("whetherMetaculusHostedOrOnPremises"),
        },
      ]}
    />
  );
}
