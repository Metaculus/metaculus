import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { getBrowserLocale } from "./utils/translation";

export default getRequestConfig(async () => {
  const locale = cookies().get("NEXT_LOCALE")
    ? cookies().get("NEXT_LOCALE")?.value
    : (await getBrowserLocale()) || "en";
  let messages;

  try {
    messages = {
      ...(await import(`../messages/en.json`)).default, 
      ...(await import(`../messages/${locale}.json`)).default, 
    };
  } catch (error) {
    console.warn(`no translations for: ${locale}, falling back to English.`);
    messages = {
      ...(await import(`../messages/en.json`)).default, 
    };
  }

  return {
    locale,
    messages,
  };
});
