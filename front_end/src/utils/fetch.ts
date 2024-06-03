import { getServerSession } from "@/services/session";
import {
  ApiErrorResponse,
  ErrorResponse,
  FetchError,
  FetchOptions,
} from "@/types/fetch";

export function encodeQueryParams(params: Record<string, any>): string {
  const encodedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map(
          (val) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
        );
      } else {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
    })
    .join("&");

  return encodedParams ? `?${encodedParams}` : "";
}

/**
 * Util for converting Django errors to the standardized way
 */
const normalizeApiErrors = (payload: ApiErrorResponse): ErrorResponse => {
  if (typeof payload === "string") {
    return {
      non_field_errors: [payload],
      message: payload,
    };
  } else if (Array.isArray(payload)) {
    return {
      non_field_errors: payload,
      message: payload[0],
    };
  } else {
    return {
      ...payload,
      message: payload.message || Object.values(payload).flat()[0],
    };
  }
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

  // Propagate current auth token
  if (authToken) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      ...(getServerSession()
        ? {
            Authorization: `Token ${getServerSession()}`,
          }
        : {}),
    };
  }

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
