"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { Suspense, useEffect, useRef } from "react";

function PostHogPageView({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();
  const sentPageleaveRef = useRef<boolean>(false);

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
        $locale: locale,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams, posthog]);

  useEffect(() => {
    if (!posthog) return;

    sentPageleaveRef.current = false;

    const sendPageLeave = () => {
      if (sentPageleaveRef.current) return;
      sentPageleaveRef.current = true;
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      posthog.capture("$pageleave", {
        $current_url: url,
      });
    };

    window.addEventListener("pagehide", sendPageLeave);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendPageLeave();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      sendPageLeave();
      window.removeEventListener("pagehide", sendPageLeave as EventListener);
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange as EventListener
      );
    };
  }, [posthog, pathname, searchParams]);

  return null;
}

// Wrap this in Suspense to avoid the `useSearchParams` usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
export default function SuspendedPostHogPageView({
  locale,
}: {
  locale: string;
}) {
  return (
    <Suspense fallback={null}>
      <PostHogPageView locale={locale} />
    </Suspense>
  );
}
