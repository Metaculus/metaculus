import { useLocale } from "next-intl";
import { FC } from "react";

import { formatDate } from "@/utils/date_formatters";

type Props = {
  date?: string;
};

const LocalDaytime: FC<Props> = ({ date }) => {
  const locale = useLocale();
  const localValue = date ? formatDate(locale, new Date(date)) : "";

  return <span>{localValue}</span>;
};

export default LocalDaytime;
