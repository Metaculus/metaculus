import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import {
  AUTOTRANSLATION_COOKIE_NAME,
  AUTOTRANSLATION_HEADER,
  parseAssignment,
} from "@/constants/experiments";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  matchLocale,
  negotiateLocale,
} from "@/services/language_service";

async function getLocale(): Promise<string> {
  const headersStore = await headers();
  const cookieStore = await cookies();

  // An explicit language choice always wins
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale) {
    return matchLocale([cookieLocale]);
  }

  // Auto-translation experiment: the control arm gets the untranslated
  // (English) site instead of Accept-Language negotiation. The header covers
  // the enrollment request itself, before the assignment cookie exists.
  const assignment = parseAssignment(
    cookieStore.get(AUTOTRANSLATION_COOKIE_NAME)?.value
  );
  const enrollmentVariant = headersStore.get(AUTOTRANSLATION_HEADER);
  if (assignment?.variant === "control" || enrollmentVariant === "control") {
    return DEFAULT_LOCALE;
  }

  return negotiateLocale(headersStore.get("accept-language"));
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
