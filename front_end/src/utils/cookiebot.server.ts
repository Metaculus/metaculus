import { NextRequest } from "next/server";

export const hasCookiePreferencesConsent = (request: NextRequest) => {
  // First, try to read from our custom consent cookie
  const customConsentCookie = request.cookies.get("all_cookies_consent")?.value;
  if (customConsentCookie) {
    try {
      const consentData = JSON.parse(customConsentCookie);
      return !!consentData.preferences;
    } catch (error) {
      console.log("error", error);
    }
  }
  return false;
};
