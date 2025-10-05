import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  LOCALES,
} from "@/services/language_service";

async function getLocale(): Promise<string> {
  const headersStore = await headers();
  const acceptLang = headersStore.get("accept-language");

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  let options = [DEFAULT_LOCALE];

  if (cookieLocale) {
    options = [cookieLocale];
  } else if (acceptLang) {
    const parsedLanguages = new Negotiator({
      headers: {
        "accept-language": acceptLang,
      },
    }).languages();

    if (parsedLanguages && parsedLanguages.length > 0) {
      options = parsedLanguages;
    }
  }
  options = options.filter((opt) => opt !== "*");

  try {
    return match(options, LOCALES, DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export default getRequestConfig(async () => {
  const locale = await getLocale();

  return {
    locale,
    messages: {
      ...(await import(`../../messages/en.json`)).default,
      ...(await import(`../../messages/${locale}.json`)).default,
    },
  };
});
