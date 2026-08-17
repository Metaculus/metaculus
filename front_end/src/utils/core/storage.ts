import { logError } from "./errors";

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("localStorage.getItem error:", error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn("localStorage.setItem error:", error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn("localStorage.removeItem error:", error);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.clear();
    } catch (error) {
      console.warn("localStorage.clear error:", error);
    }
  },

  keys: (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.warn("localStorage keys error:", error);
      return [];
    }
  },
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.warn("sessionStorage.getItem error:", error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn("sessionStorage.setItem error:", error);
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn("sessionStorage.removeItem error:", error);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.warn("sessionStorage.clear error:", error);
    }
  },
};

export function readJSON<T>(key: string): T | null {
  try {
    const raw = safeLocalStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    logError(e, { message: `Failed to parse localStorage for ${key}` });
    return null;
  }
}

export function writeJSON(key: string, val: unknown) {
  safeLocalStorage.setItem(key, JSON.stringify(val));
}

// document.cookie throws SecurityError in null-origin documents (pages
// rendered under a sandbox without allow-same-origin, e.g. injected
// `Content-Security-Policy: sandbox` or sandboxed iframes)
type CookieOptions = {
  path?: string;
  maxAge?: number;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export const safeDocumentCookie = {
  get: (name: string): string | null => {
    if (typeof document === "undefined") return null;
    try {
      return (
        document.cookie
          .split("; ")
          .find((cookie) => cookie.startsWith(`${name}=`))
          ?.slice(name.length + 1) ?? null
      );
    } catch (error) {
      logError(error, { message: "document.cookie read error" });
      return null;
    }
  },

  // Omitting maxAge creates a session cookie. Values are written without URL
  // encoding, so they must stay cookie-safe: Next's request cookie parser
  // decodeURIComponents each value and silently drops any that fail to decode
  set: (name: string, value: string, options: CookieOptions = {}): void => {
    if (typeof document === "undefined") return;
    const { path = "/", maxAge, sameSite = "lax" } = options;
    // Browsers silently reject SameSite=None cookies that aren't Secure
    const secure = options.secure || sameSite === "none";

    let cookie = `${name}=${value}; path=${path}; samesite=${sameSite}`;
    if (maxAge !== undefined) {
      cookie += `; max-age=${maxAge}`;
    }
    if (secure) {
      cookie += "; secure";
    }

    try {
      document.cookie = cookie;
    } catch (error) {
      logError(error, { message: "document.cookie write error" });
    }
  },
};
