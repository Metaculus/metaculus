import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";
import cn from "@/utils/core/cn";
import { formatIntlDistance } from "@/utils/formatters/date";

type Props = {
  cpRevealsOn: string;
  className?: string;
};

const UpcomingCP: FC<Props> = ({ cpRevealsOn, className }) => {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <div className={cn("w-full text-center", className)}>
      <span className="block">{t("cpRevealed")}</span>
      <RelativeTime datetime={cpRevealsOn} lang={locale} className="leading-6">
        {formatIntlDistance(locale, cpRevealsOn, new Date())}
      </RelativeTime>
    </div>
  );
};

export default UpcomingCP;
