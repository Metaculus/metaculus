import { useTranslations } from "next-intl";
import { FC } from "react";

const BotsDisclaimer: FC = () => {
  const t = useTranslations();

  return (
    <div className="text-md w-full rounded border border-orange-400 bg-orange-50 px-5 py-4 text-sm leading-6 text-orange-900 dark:border-orange-400-dark dark:bg-orange-50-dark dark:text-orange-900-dark sm:px-6">
      {t("myForecastingBotsDisclaimer")}
    </div>
  );
};

export default BotsDisclaimer;
