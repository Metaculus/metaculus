import { useTranslations } from "next-intl";
import { FC } from "react";

import RichText from "@/components/rich_text";

import ProForecasterLink from "./link";

const ProForecastersHero: FC = () => {
  const t = useTranslations();

  return (
    <>
      <h1 className="m-0 text-2xl font-bold text-gray-800 dark:text-gray-800-dark md:text-3xl md:font-semibold">
        {t("proForecastersTitle")}
      </h1>
      <p className="m-0">
        <RichText>
          {(tags) =>
            t.rich("proForecastersDescription", {
              ...tags,
              email: (chunks) => (
                <ProForecasterLink href="mailto:support@metaculus.com">
                  {chunks}
                </ProForecasterLink>
              ),
            })
          }
        </RichText>
      </p>
    </>
  );
};

export default ProForecastersHero;
