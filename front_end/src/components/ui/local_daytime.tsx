import { useLocale } from "next-intl";
import { FC } from "react";
import "@github/relative-time-element";

import { formatDate } from "@/utils/date_formatters";

type Props = {
  date?: string;
};

const LocalDaytime: FC<Props> = ({ date }) => {
  let locale = useLocale();
  if (locale === "original") {
    // For some reason, when the locale is "original" (Untranslated), the the server and client
    //  endup with different values for  the localValue variable. This is a workaround to
    // make sure the dates render correctly on both and default to English locale when
    // in Untranslated mode
    locale = "en";
  }
  const localValue = date ? formatDate(locale, new Date(date)) : "";

  return (
    <relative-time
      datetime={date}
      format="relative"
      prefix=""
      threshold="P1D"
      year="numeric"
      lang={locale}
      title=""
    >
      {localValue}
    </relative-time>
  );
};

export default LocalDaytime;
