import { useTranslations } from "next-intl";
import { FC } from "react";

import CursorDetailItem from "@/components/cursor_details/item";

type Props = {
  forecastersNr: number;
  min: string;
  mean: string;
  max: string;
};

const CursorDetails: FC<Props> = ({ forecastersNr, min, mean, max }) => {
  const t = useTranslations();

  return (
    <div className="my-3 grid grid-cols-2 gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:gap-x-4 sm:gap-y-0">
      <CursorDetailItem
        title={t("totalForecastersLabel")}
        text={forecastersNr.toString()}
      />
      <CursorDetailItem
        title={t("communityPredictionLabel")}
        text={`${mean} (${min} - ${max})`}
        variant="prediction"
      />
    </div>
  );
};

export default CursorDetails;
