import { useEffect, useRef, useState, useTransition } from "react";

export const useServerAction = <P extends unknown[], R>(
  action: (...args: P) => Promise<R>,
  onFinished?: (_: R | undefined) => void
): [(...args: P) => Promise<R | undefined>, boolean] => {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<R>();
  const [finished, setFinished] = useState(false);
  const resolver = useRef<(value?: R | PromiseLike<R>) => void>(undefined);

  useEffect(() => {
    if (!finished) return;

    if (onFinished) onFinished(result);
    resolver.current?.(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, finished]);

  const runAction = async (...args: P): Promise<R | undefined> => {
    startTransition(() => {
      action(...args).then((data) => {
        setResult(data);
        setFinished(true);
      });
    });

    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  };

  return [runAction, isPending];
};
