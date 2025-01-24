import { intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";
import "@github/relative-time-element";

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
      <relative-time datetime={cpRevealTime} lang={locale}>
        {intlFormatDistance(cpRevealTime, new Date(), { locale })}
      </relative-time>
    </span>
  );
};

export default CPRevealTime;
