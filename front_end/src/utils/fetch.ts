import { ErrorResponse, FetchError, FetchOptions } from "@/types/fetch";

export function encodeQueryParams(params: Record<string, any>): string {
  const encodedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return encodedParams ? `?${encodedParams}` : "";
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json();
    const error: FetchError = new Error(
      errorData.message || "An error occurred"
    );
    error.response = response;
    error.data = errorData;
    throw error;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text);
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const defaultOptions: FetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

const appFetch = async <T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const finalUrl = `${BASE_URL}${url}`;
  const finalOptions: FetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(finalUrl, finalOptions);
    return await handleResponse<T>(response);
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const get = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "GET" });
};

const post = async <T, B>(
  url: string,
  body: B,
  options: FetchOptions = {}
): Promise<T> => {
  return appFetch<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
};

const put = async <T, B>(
  url: string,
  body: B,
  options: FetchOptions = {}
): Promise<T> => {
  return appFetch<T>(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
};

const del = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "DELETE" });
};

export { get, post, put, del };
export default appFetch;
