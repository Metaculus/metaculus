import { intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import "@github/relative-time-element";

type Props = {
  cpRevealsOn: string;
};

const UpcomingCP: FC<Props> = ({ cpRevealsOn }) => {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <div className="flex min-w-[200px] max-w-[200px] flex-col items-center gap-0">
      <span className="text-xs font-normal leading-4 text-purple-700 dark:text-purple-700-dark">
        {t("forecastRevealed")}{" "}
      </span>
      <relative-time
        datetime={cpRevealsOn}
        lang={locale}
        className="text-base font-medium leading-6 text-purple-800 dark:text-purple-800-dark"
      >
        {intlFormatDistance(cpRevealsOn, new Date(), {
          locale,
        })}
      </relative-time>
    </div>
  );
};

export default UpcomingCP;
