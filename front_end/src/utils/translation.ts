import { headers } from "next/headers";
import { getLocale } from "next-intl/server";

export function getBrowserLocale() {
  return (
    headers().get("accept-language")?.split(",")[0].slice(0, 2) ||
    getLocale() ||
    "en"
  );
}
