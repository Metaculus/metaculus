import { useTranslations } from "next-intl";
import { FC } from "react";

import { PRO_FORECASTERS } from "@/app/(main)/pro-forecasters/constants/pro_forecasters";
import cn from "@/utils/core/cn";

import ProForecasterCard from "./pro_forecaster_card";
import EmblaCarousel from "../../components/embla_carousel";

type Props = {
  className?: string;
};

const ProForecastersBlock: FC<Props> = ({ className }) => {
  const t = useTranslations();

  return (
    <div className={cn("flex flex-col", className)}>
      <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-700-dark">
        {t("proForecastersBlockTitle")}
      </h3>
      <p className="m-0 mt-3 text-center text-xl font-medium text-blue-700 dark:text-blue-700-dark">
        {t("proForecastersBlockDescription")}
      </p>
      <div className="mt-12 px-4 sm:px-0">
        {/* Adjust visibility of arrows when adding more pro forecasters */}
        <EmblaCarousel
          arrowsClassName="text-blue-800/30 dark:text-blue-800-dark/30 md:hidden"
          buttonPosition="loose"
          config={{
            watchDrag: false,
          }}
        >
          <div className="-ml-3 flex">
            {PRO_FORECASTERS.map((proForecaster, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] pl-3 xs:flex-[0_0_50%] md:flex-[0_0_33.33%]"
              >
                <ProForecasterCard
                  key={proForecaster.id}
                  proForecaster={proForecaster}
                />
              </div>
            ))}
          </div>
        </EmblaCarousel>
      </div>
    </div>
  );
};

export default ProForecastersBlock;
