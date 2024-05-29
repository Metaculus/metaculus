export type FetchOptions = RequestInit & {
  headers?: HeadersInit;
};

export type ErrorResponse = {
  message: string;
  [key: string]: any;
};

export type FetchError = Error & {
  response?: Response;
  data?: ErrorResponse;
};

export type PaginatedPayload<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
