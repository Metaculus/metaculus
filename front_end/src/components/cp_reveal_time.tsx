import { intlFormatDistance } from "date-fns";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import LocalDaytime from "./ui/local_daytime";

type Props = {
  cpRevealTime: string;
  className?: string;
};

const CPRevealTime: FC<Props> = ({ cpRevealTime, className }) => {
  const t = useTranslations();

  return (
    <span className={className}>
      {t("cpRevealed")}{" "}
      <LocalDaytime
        date={cpRevealTime}
        formatFn={(date, locale) =>
          intlFormatDistance(date, new Date(), { locale })
        }
      />
    </span>
  );
};

export default CPRevealTime;
