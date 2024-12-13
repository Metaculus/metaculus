import { useLocale } from "next-intl";
import { useEffect, useState, FC } from "react";

import { formatDate } from "@/utils/date_formatters";

type Props = {
  date?: string;
  formatFn?: (date: Date, locale: string) => string;
  className?: string;
};

const LocalDaytime: FC<Props> = ({ date, formatFn, className }) => {
  const locale = useLocale();
  const [localValue, setLocalValue] = useState<string>("");

  useEffect(() => {
    if (date) {
      const localDate = new Date(date);
      const localDateString = formatFn
        ? formatFn(localDate, locale)
        : formatDate(locale, localDate);
      setLocalValue(localDateString);
    }
  }, [date, formatFn, locale]);

  return <span className={className}>{localValue}</span>;
};

export default LocalDaytime;
