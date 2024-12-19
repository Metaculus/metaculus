import { useCallback, useEffect, useRef, useState } from "react";

type Timer = ReturnType<typeof setTimeout>;

export const useDebouncedValue = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useDebouncedCallback = <T>(
  func: (arg: T) => void,
  wait: number
) => {
  const timeout = useRef<Timer>();

  const debouncedFunc = (arg: T) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => func(arg), wait);
  };

  return useCallback(debouncedFunc, [func, wait]);
};
