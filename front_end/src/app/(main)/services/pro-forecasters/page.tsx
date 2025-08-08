import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ProForecastersPageTemplate from "../components/templates/pro_forecasters_page_template";

export const metadata = {
  title: "Deploy Metaculus Pro Forecasters on Key Questions",
  description:
    "Access calibrated forecasts from top predictors. Metaculus Pro Forecasters bring transparent reasoning and expert insight to your organization’s most important questions.",
};

export default async function ProForecastersPage() {
  const t = await getTranslations();

  return (
    <ProForecastersPageTemplate
      title={t.rich("metaculusProForecasters", {
        span: (chunks) => (
          <span className="text-blue-700 dark:text-blue-700-dark">
            {chunks}
          </span>
        ),
      })}
      description={{
        firstPart: t("proForecastersHeaderFirstParagraph"),
        secondPart: t("proForecastersHeaderSecondParagraph"),
      }}
      howItWorksDescription={t("stepsForCollaboratingWithProForecasters")}
      steps={[
        {
          title: t("contactUs"),
          description: t("proForecastersStep1Description"),
          titleClassName: "lg:pr-10",
        },
        {
          title: t("proForecastersStep2Title"),
          description: t("proForecastersStep2Description"),
        },
        {
          title: t("proForecastersStep3Title"),
          description: t("proForecastersStep3Description"),
        },
      ]}
      caseStudy={{
        title: t("proForecastersCaseStudyTitle"),
        description: {
          firstPart: t("proForecastersCaseStudyParagraph1"),
          secondPart: t.rich("proForecastersCaseStudyParagraph2", {
            link: (chunks) => (
              <Link
                className="underline"
                href="/tournament/respiratory-outlook-24-25/"
              >
                {chunks}
              </Link>
            ),
          }),
        },
      }}
    />
  );
}
