import { useCallback, useSyncExternalStore } from "react";

// Always false on the server and on the first client render, so only use it
// for UI that appears after an interaction (e.g. menu contents).
const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
};

export default useMediaQuery;
