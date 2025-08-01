import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Service for managing the NEXT_LOCALE cookie consistently across the application
 */
export class LocaleCookieService {
  /**
   * Set the locale cookie on the server side (for server actions)
   */
  static async setLocale(locale: string | null): Promise<void> {
    const cookieStore = await cookies();

    if (locale) {
      cookieStore.set(LOCALE_COOKIE_NAME, locale, {
        maxAge: COOKIE_MAX_AGE,
      });
    } else {
      cookieStore.delete(LOCALE_COOKIE_NAME);
    }
  }

  /**
   * Set the locale cookie in middleware response
   */
  static setLocaleInResponse(response: NextResponse, locale: string): void {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      maxAge: COOKIE_MAX_AGE,
    });
  }
}

// Export constants for external use
export { LOCALE_COOKIE_NAME, COOKIE_MAX_AGE };
