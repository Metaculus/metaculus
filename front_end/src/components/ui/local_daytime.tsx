import { useLocale } from "next-intl";
import { useEffect, useState, FC } from "react";

import { formatDate } from "@/utils/date_formatters";

type Props = {
  date?: string;
  className?: string;
};

const LocalDaytime: FC<Props> = ({ date, className }) => {
  const locale = useLocale();
  const [localValue, setLocalValue] = useState<string>("");

  useEffect(() => {
    if (date) {
      const localDate = new Date(date);
      const localDateString = formatDate(locale, localDate);
      setLocalValue(localDateString);
    }
  }, [date, locale]);

  return <span className={className}>{localValue}</span>;
};

export default LocalDaytime;
