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
