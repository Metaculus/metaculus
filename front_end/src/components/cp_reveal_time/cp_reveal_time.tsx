import { differenceInHours } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";
import { formatIntlDate, formatIntlDistance } from "@/utils/formatters/date";

type Props = {
  cpRevealTime: string;
  hiddenUntilView?: boolean;
  className?: string;
};

const CPRevealTime: FC<Props> = ({
  cpRevealTime,
  hiddenUntilView = false,
  className = "",
}) => {
  const t = useTranslations();
  const locale = useLocale();

  if (hiddenUntilView) {
    const revealDate = new Date(cpRevealTime);
    const now = new Date();
    const hoursUntilReveal = differenceInHours(revealDate, now);

    return (
      <span className={className}>
        {t("hiddenUntil")}
        <br />
        {formatIntlDate(
          locale,
          revealDate,
          hoursUntilReveal < 24
            ? {
                hour: "2-digit",
                minute: "2-digit",
              }
            : {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
        )}
      </span>
    );
  }

  return (
    <span className={className}>
      {t("cpRevealed")}{" "}
      <RelativeTime datetime={cpRevealTime} lang={locale}>
        {formatIntlDistance(locale, cpRevealTime, new Date())}
      </RelativeTime>
    </span>
  );
};

export default CPRevealTime;
