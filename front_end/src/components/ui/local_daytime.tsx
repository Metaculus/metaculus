import { useLocale } from "next-intl";
import { FC } from "react";
import "@github/relative-time-element";

import { formatDate } from "@/utils/date_formatters";

type Props = {
  date?: string;
};

const LocalDaytime: FC<Props> = ({ date }) => {
  const locale = useLocale();
  const localValue = date ? formatDate(locale, new Date(date)) : "";

  return (
    <relative-time
      datetime={date}
      format="relative"
      prefix=""
      threshold="P1D"
      year="numeric"
      lang={locale}
    >
      {localValue}
    </relative-time>
  );
};

export default LocalDaytime;
