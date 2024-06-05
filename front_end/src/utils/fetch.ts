import { getServerSession } from "@/services/session";
import {
  ApiErrorResponse,
  ErrorResponse,
  FetchError,
  FetchOptions,
} from "@/types/fetch";

/**
 * Util for converting Django errors to the standardized way
 */
const normalizeApiErrors = ({
  detail,
  ...props
}: ApiErrorResponse): ErrorResponse => {
  return {
    ...props,
    message: detail,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();

    // Converting Django errors
    const data: ErrorResponse = normalizeApiErrors(errorData);

    const error: FetchError = new Error("An error occurred");
    error.response = response;
    error.data = data;
    throw error;
  }

  // Some endpoints might still have successful null response
  // So need to handle such cases
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
  const authToken = getServerSession();

  const finalUrl = `${BASE_URL}${url}`;
  const finalOptions: FetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      // Propagate current auth token
      ...(authToken
        ? {
            Authorization: `Token ${authToken}`,
          }
        : {}),
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

const patch = async <T, B>(
  url: string,
  body: B,
  options: FetchOptions = {}
): Promise<T> => {
  return appFetch<T>(url, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
};

const del = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "DELETE" });
};

export { get, post, put, del, patch };
export default appFetch;
