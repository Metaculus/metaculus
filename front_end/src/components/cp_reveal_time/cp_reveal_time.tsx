import { differenceInHours, intlFormat, intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import React, { FC } from "react";
import "@github/relative-time-element";

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
      {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
      <relative-time datetime={cpRevealTime} lang={locale}>
        {intlFormatDistance(cpRevealTime, new Date(), { locale })}
        {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
      </relative-time>
    </span>
  );
};

export default CPRevealTime;
