import { useEffect, useState } from "react";

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number }
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

// Defers expensive rendering until the browser is idle. Returns true
// synchronously when `enabled` is false, and re-defers when `resetKey` changes.
export default function useDeferredRender(
  enabled: boolean,
  resetKey?: unknown
): boolean {
  const [readyKey, setReadyKey] = useState<{ value: unknown } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const win = window as WindowWithIdleCallback;
    let timeoutId: number | undefined;
    let idleCallbackId: number | undefined;

    const markReady = () => setReadyKey({ value: resetKey });

    if (win.requestIdleCallback) {
      idleCallbackId = win.requestIdleCallback(markReady, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(markReady, 150);
    }

    return () => {
      if (idleCallbackId !== undefined && win.cancelIdleCallback) {
        win.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [enabled, resetKey]);

  return !enabled || (readyKey !== null && Object.is(readyKey.value, resetKey));
}
