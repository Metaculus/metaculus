export type FetchConfig = {
  emptyContentType?: boolean;
  passAuthHeader?: boolean;
  includeLocale?: boolean;
  forceLocale?: string;
};

export type Fetcher = {
  get<T>(url: string, options?: FetchOptions, config?: FetchConfig): Promise<T>;
  post<T = Response, B = Record<string, unknown>>(
    url: string,
    body: B,
    options?: FetchOptions,
    config?: FetchConfig
  ): Promise<T>;
  put<T, B>(url: string, body: B, options?: FetchOptions): Promise<T>;
  patch<T, B>(url: string, body: B, options?: FetchOptions): Promise<T>;
  del<T>(url: string, options?: FetchOptions): Promise<T>;
};

export type FetchOptions = RequestInit & {
  headers?: HeadersInit;
};

/**
 * Raw error response from BE
 */
export type ApiErrorResponse = Record<string, string[]> & {
  non_field_errors?: string[];
  detail?: string;
};

/**
 * Normalized Error response
 */
export type ErrorResponse = {
  // Summary message
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  non_field_errors?: string[];
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedPayload<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
