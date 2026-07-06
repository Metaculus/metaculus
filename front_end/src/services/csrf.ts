import "server-only";

import { cookies } from "next/headers";

import { CookieStorage, ReadonlyCookieStorage } from "@/types/cookies";

export const CSRF_COOKIE_NAME = "_csrf";

const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Manager for CSRF token cookie.
 * Works with next/headers cookies() and response.cookies (CookieStorage).
 */
export class CsrfManager {
  constructor(private cookieStorage: CookieStorage) {}

  private getToken(): string | null {
    return this.cookieStorage.get(CSRF_COOKIE_NAME)?.value || null;
  }

  verify(nonce: string): void {
    const csrfToken = this.getToken();
    if (!csrfToken || csrfToken !== nonce) {
      throw new Error("Invalid CSRF token");
    }
  }

  /**
   * Generate a new CSRF token if one doesn't exist.
   * In middleware, pass request.cookies to check for existing token.
   */
  generate(checkStorage?: ReadonlyCookieStorage): void {
    const existingToken = checkStorage
      ? checkStorage.get(CSRF_COOKIE_NAME)?.value
      : this.getToken();

    if (!existingToken) {
      this.cookieStorage.set(
        CSRF_COOKIE_NAME,
        crypto.randomUUID(),
        CSRF_COOKIE_OPTIONS
      );
    }
  }

  rotate(): void {
    this.cookieStorage.set(
      CSRF_COOKIE_NAME,
      crypto.randomUUID(),
      CSRF_COOKIE_OPTIONS
    );
  }
}

/**
 * Factory function to create a CsrfManager from next/headers cookies().
 * Use this in server components and server actions.
 */
export async function getCsrfManager(): Promise<CsrfManager> {
  const cookieStorage = await cookies();
  return new CsrfManager(cookieStorage);
}
