import { NextRequest } from "next/server";
import { getPublicSettings } from "./public_settings.server";

export const hasCookiePreferencesConsent = (request: NextRequest) => {
  if (!getPublicSettings().PUBLIC_COOKIEBOT_ID) {
    // If not using Cookiebot, allow preferences cookies
    return true;
  }

  const cookieConsent = request.cookies.get("CookieConsent")?.value;
  if (cookieConsent) {
    try {
      // The cookie value is in JavaScript object literal format, not JSON
      // Use regex to extract the preferences value
      const preferencesMatch = cookieConsent.match(/preferences:([^,}]+)/);
      if (preferencesMatch && preferencesMatch[1]) {
        const preferencesValue = preferencesMatch[1].trim();
        return preferencesValue === "true";
      }
    } catch (error) {
      return false;
    }
  }
  return false;
};
