import { useTranslations } from "next-intl";
import { FC } from "react";

import RichText from "@/components/rich_text";

import ProForecastersHero from "./components/hero_section";
import ProForecastersInfoSection from "./components/info_section";
import ProForecasterLink from "./components/link";
import ProForecastersSection from "./components/pro_forecasters_section";

export default function ProForecastersPage() {
  const t = useTranslations();

  return (
    <main className="mx-auto w-full max-w-[976px] space-y-5 bg-gray-0 px-5 py-8 dark:bg-gray-0-dark md:p-8 min-[976px]:my-10 min-[976px]:rounded-md">
      <ProForecastersHero />
      <Divider />
      <ProForecastersSection />
      <Divider />
      <ProForecastersInfoSection
        title={t("whyUseProForecastersTitle")}
        info={
          <RichText>
            {(tags) =>
              t.rich("whyUseProForecastersInfo", {
                ...tags,
                link: (chunks) => (
                  <ProForecasterLink href="/questions/track-record/" internal>
                    {chunks}
                  </ProForecasterLink>
                ),
              })
            }
          </RichText>
        }
        size="lg"
      />
      <ProForecastersInfoSection
        title={t("selectingProForecastersTitle")}
        info={t("selectingProForecastersInfo")}
        size="lg"
      />
      <ProForecastersInfoSection
        title={t("excellentForecastAbilityTitle")}
        info={
          <RichText>
            {(tags) =>
              t.rich("excellentForecastAbilityInfo", {
                ...tags,
                link: (chunks) => (
                  <ProForecasterLink href="/leaderboard" internal>
                    {chunks}
                  </ProForecasterLink>
                ),
              })
            }
          </RichText>
        }
      />
      <ProForecastersInfoSection
        title={t("robustTrackRecordsTitle")}
        info={
          <RichText>
            {(tags) => t.rich("robustTrackRecordsInfo", tags)}
          </RichText>
        }
      />
      <ProForecastersInfoSection
        title={t("clearCommentsAndCommunicationTitle")}
        info={t("clearCommentsAndCommunicationInfo")}
      />
    </main>
  );
}

const Divider: FC = () => (
  <hr className="m-0 w-full border-blue-400 dark:border-blue-400-dark" />
);
