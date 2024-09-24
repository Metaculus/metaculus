import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { getBrowserLocale } from "./utils/translation";

export default getRequestConfig(async () => {
  const locale = cookies().get("NEXT_LOCALE")
    ? cookies().get("NEXT_LOCALE")?.value
    : (await getBrowserLocale()) || "en";
  return {
    locale,
    messages: {
      ...(await import(`../messages/en.json`)).default,
      ...(await import(`../messages/${locale}.json`)).default,
    },
  };
});
