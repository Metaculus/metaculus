import { useLocale } from "next-intl";
import { FC } from "react";
import "@github/relative-time-element";

import { formatDate } from "@/utils/formatters/date";

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
    // @ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304
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
      {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
    </relative-time>
  );
};

export default LocalDaytime;
