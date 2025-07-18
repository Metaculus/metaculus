import { intlFormatDistance } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import "@github/relative-time-element";
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
      {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
      <relative-time datetime={cpRevealsOn} lang={locale} className="leading-6">
        {intlFormatDistance(cpRevealsOn, new Date(), {
          locale,
        })}
        {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
      </relative-time>
    </div>
  );
};

export default UpcomingCP;
