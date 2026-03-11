import { useLocale } from "next-intl";
import { FC } from "react";

import RelativeTime from "@/components/ui/relative_time";
import { formatDate, normalizeIntlLocale } from "@/utils/formatters/date";

type Props = {
  date?: string;
};

const LocalDaytime: FC<Props> = ({ date }) => {
  const locale = normalizeIntlLocale(useLocale());
  const localValue = date ? formatDate(locale, new Date(date)) : "";

  return (
    <RelativeTime
      datetime={date}
      format="relative"
      prefix=""
      threshold="P1D"
      year="numeric"
      lang={locale}
      title=""
    >
      {localValue}
    </RelativeTime>
  );
};

export default LocalDaytime;
