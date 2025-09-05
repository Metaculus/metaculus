import { intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";
import cn from "@/utils/core/cn";

type Props = {
  cpRevealsOn: string;
  className?: string;
};

const UpcomingCP: FC<Props> = ({ cpRevealsOn, className }) => {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <div className={cn("w-full text-center", className)}>
      <span>{t("cpRevealed")} </span>
      <RelativeTime datetime={cpRevealsOn} lang={locale} className="leading-6">
        {intlFormatDistance(cpRevealsOn, new Date(), {
          locale,
        })}
      </RelativeTime>
    </div>
  );
};

export default UpcomingCP;
