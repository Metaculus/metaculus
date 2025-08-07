import { intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";

type Props = {
  cpRevealTime: string;
  className?: string;
};

const CPRevealTime: FC<Props> = ({ cpRevealTime, className }) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <span className={className}>
      {t("cpRevealed")}{" "}
      <RelativeTime datetime={cpRevealTime} lang={locale}>
        {intlFormatDistance(cpRevealTime, new Date(), { locale })}
      </RelativeTime>
    </span>
  );
};

export default CPRevealTime;
