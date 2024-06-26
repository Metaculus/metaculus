"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface WindowTurnstile extends Window {
  turnstile?: {
    render: (
      container: string,
      config: { sitekey: string; callback: (token: string) => void }
    ) => string;
    reset: (widgetId: string) => void;
  };
  initCallback?: (() => void) | null;
}

const useTurnstileWidget = () => {
  const windowTurnstile =
    typeof window !== "undefined" ? (window as WindowTurnstile) : undefined;

  const [turnstileToken, setTurnstileToken] = useState<string>();
  const [widgetId, setWidgetId] = useState<string>();

  const turnstileWidget = useMemo(
    () =>
      !!TURNSTILE_SITE_KEY ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=initCallback"
            strategy="lazyOnload"
            defer
            async
          />
          <div id="turnstile-container" />
        </>
      ) : null,
    []
  );

  const initCallback = () => {
    if (windowTurnstile && windowTurnstile?.turnstile && TURNSTILE_SITE_KEY) {
      const id = windowTurnstile.turnstile.render("#turnstile-container", {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (turnstileToken) => setTurnstileToken(turnstileToken),
      });

      setWidgetId(id);
    }
  };

  useEffect(() => {
    if (windowTurnstile) {
      windowTurnstile.initCallback = initCallback;
    }

    return () => {
      windowTurnstile!.initCallback = null;
    };
  }, []);

  useEffect(() => {
    initCallback();
  }, [turnstileWidget]);

  const turnstileResetWidget = useCallback(() => {
    if (windowTurnstile && windowTurnstile?.turnstile && widgetId) {
      windowTurnstile.turnstile.reset(widgetId);
    }
  }, [widgetId]);

  return { turnstileWidget, turnstileToken, turnstileResetWidget };
};

export default useTurnstileWidget;
