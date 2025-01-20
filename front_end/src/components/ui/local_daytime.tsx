import { useLocale } from "next-intl";
import { FC } from "react";

import { formatDate } from "@/utils/date_formatters";

type Props = {
  date?: string;
  formatFn?: (date: Date, locale: string) => string;
};

const LocalDaytime: FC<Props> = ({ date, formatFn }) => {
  const locale = useLocale();
  const localValue = date
    ? formatFn
      ? formatFn(new Date(date), locale)
      : formatDate(locale, new Date(date))
    : "";

  return <span>{localValue}</span>;
};

export default LocalDaytime;
