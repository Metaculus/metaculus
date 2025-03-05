import { useCallback, useEffect, useRef, useState } from "react";

type Timer = ReturnType<typeof setTimeout>;

type DebounceOptions = {
  leading?: boolean;
  trailing?: boolean;
};

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
  wait: number,
  options?: DebounceOptions
) => {
  const timeout = useRef<Timer>();
  const funcRef = useRef(func);
  const argRef = useRef<T | null>(null);

  const { leading = false, trailing = true } = options ?? {};

  // keep the function reference updated
  useEffect(() => {
    funcRef.current = func;
  }, [func]);

  // clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return useCallback(
    (arg: T) => {
      argRef.current = arg;
      const callNow = leading && !timeout.current;

      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      timeout.current = setTimeout(() => {
        if (trailing && !callNow) {
          // okay to ignore since we update ref on every call
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          funcRef.current(argRef.current!);
        }
        timeout.current = undefined;
      }, wait);

      if (callNow) {
        funcRef.current(arg);
      }
    },
    [wait, leading, trailing]
  );
};
