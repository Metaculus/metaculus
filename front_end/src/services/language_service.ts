import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { CurrentUser } from "@/types/users";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds
const LOCALES = ["cs", "en", "es", "zh", "zh-TW", "pt", "original"];
// Read the translations documentation for more info on "original"
const DEFAULT_LOCALE = "en";

export class LanguageService {
  /**
   * Set the locale cookie on the server side (for server actions)
   */
  static async setLocaleCookie(locale: string | null): Promise<void> {
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
  static setLocaleCookieInResponse(
    response: NextResponse,
    locale: string
  ): void {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      maxAge: COOKIE_MAX_AGE,
    });
  }

  /**
   * Get the current locale from cookies (server-side)
   */
  static async getLocaleCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(LOCALE_COOKIE_NAME)?.value || null;
  }

  /**
   * Synchronize user's language preference across browser sessions
   * If user's language preference doesn't match current locale, redirect with correct locale
   */
  static async syncUserLanguagePreference(
    user: CurrentUser | null,
    currentLocale: string
  ): Promise<void> {
    // Only sync if user is authenticated and has a language preference
    if (!user?.language || !LOCALES.includes(user.language)) return;

    // Check if user's preference matches current locale
    if (user.language !== currentLocale) {
      const headersStore = await headers();
      const currentUrl = headersStore.get("x-url") || "";
      const url = new URL(currentUrl);

      // Add locale parameter and redirect
      // Middleware will catch this and set the NEXT_LOCALE cookie
      url.searchParams.set("locale", user.language);
      redirect(url.pathname + url.search);
    }
  }
}

// Export constants for external use
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE_NAME, COOKIE_MAX_AGE };
