export type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
};

export interface ReadonlyCookieStorage {
  get(name: string): { value: string } | undefined;
}

export interface CookieStorage extends ReadonlyCookieStorage {
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
}
