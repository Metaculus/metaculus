import { FetchConfig, Fetcher, FetchOptions } from "@/types/fetch";

export abstract class ApiService {
  constructor(protected fetcher: Fetcher) {}

  protected get<T>(
    url: string,
    options?: FetchOptions,
    config?: FetchConfig
  ): Promise<T> {
    return this.fetcher.get(url, options, config);
  }

  protected post<T = Response, B = Record<string, unknown>>(
    url: string,
    body: B,
    options?: FetchOptions,
    config?: FetchConfig
  ): Promise<T> {
    return this.fetcher.post(url, body, options, config);
  }

  protected put<T, B>(
    url: string,
    body: B,
    options?: FetchOptions
  ): Promise<T> {
    return this.fetcher.put(url, body, options);
  }

  protected patch<T, B>(
    url: string,
    body: B,
    options?: FetchOptions
  ): Promise<T> {
    return this.fetcher.patch(url, body, options);
  }

  protected delete<T>(url: string, options?: FetchOptions): Promise<T> {
    return this.fetcher.del(url, options);
  }
}
