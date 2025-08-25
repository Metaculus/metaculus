import { differenceInHours, intlFormat, intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";

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
        {intlFormat(
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
              },
          { locale }
        )}
      </span>
    );
  }

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
