import { useRef, useEffect } from "react";

const usePrevious = <T>(value: T) => {
  const ref = useRef<T>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

export default usePrevious;
