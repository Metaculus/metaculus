import { useCallback, useEffect, useState } from "react";

type UseStoredStateReturn<T> = [
  T,
  (newValue: T | ((prev: T) => T)) => void,
  () => void,
];

function useStoredState<T>(
  key: string,
  defaultValue: T
): UseStoredStateReturn<T> {
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

  const [value, setValueState] = useState<T>(readStoredValue);

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

  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValueState((prev) =>
      typeof newValue === "function"
        ? (newValue as (prev: T) => T)(prev)
        : newValue
    );
  }, []);

  const deleteValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(
        `useStoredState: Error removing "${key}" from localStorage`,
        error
      );
    }
    setValueState(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, deleteValue];
}

export default useStoredState;
