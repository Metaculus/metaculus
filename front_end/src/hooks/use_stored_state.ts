import { useCallback, useEffect, useState } from "react";

function useStoredState<T>(key: string, defaultValue: T) {
  const readStoredValue = useCallback((): T => {
    if (typeof window === "undefined") {
      return defaultValue; // SSR fallback
    }

    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch (error) {
      console.warn(
        `useStoredState: Error reading "${key}" from localStorage`,
        error
      );
      return defaultValue;
    }
  }, [key, defaultValue]);

  const [value, setValue] = useState<T>(readStoredValue);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(
        `useStoredState: Error writing "${key}" to localStorage`,
        error
      );
    }
  }, [key, value]);

  const deleteValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(
        `useStoredState: Error removing "${key}" from localStorage`,
        error
      );
    }
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, deleteValue] as const;
}

export default useStoredState;
