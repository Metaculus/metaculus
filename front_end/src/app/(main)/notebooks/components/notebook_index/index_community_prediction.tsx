import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

export type IndexCommunityPrediction = {
  rawValue: number | null;
  displayValue: string;
  weekMovement: number | null;
};

const CommunityPrediction: FC<IndexCommunityPrediction> = ({
  rawValue,
  displayValue,
  weekMovement,
}) => {
  const t = useTranslations();

  if (isNil(rawValue)) {
    return (
      <span className="text-gray-500 dark:text-gray-500-dark">
        {t("notAvailable")}
      </span>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="font-bold text-gray-700 dark:text-gray-700-dark">
        {displayValue}
      </span>
    </div>
  );
};

export default CommunityPrediction;
