import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

// Read the translations documentation for more info on "original"
const locales = ["cs", "en", "es", "zh", "pt", "original"];
const defaultLocale = "en";

function getLocale(): string {
  const acceptLang = headers().get("accept-language");
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;

  let options = [defaultLocale];

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
    return match(options, locales, defaultLocale);
  } catch (err) {
    return defaultLocale;
  }
}

export default getRequestConfig(async () => {
  const locale = getLocale();

  return {
    locale,
    messages: {
      ...(await import(`../messages/en.json`)).default,
      ...(await import(`../messages/${locale}.json`)).default,
    },
  };
});
