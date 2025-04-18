"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  FC,
  createContext,
  ReactNode,
} from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";
import SuspendedPostHogPageView from "@/components/posthog_page_view";
import { getPublicSetting } from "@/components/public_settings_script";

export function CSPostHogProvider({ children }: { children: ReactNode }) {
  const PUBLIC_POSTHOG_KEY = getPublicSetting("PUBLIC_POSTHOG_KEY");
  const PUBLIC_POSTHOG_BASE_URL = getPublicSetting("PUBLIC_POSTHOG_BASE_URL");
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (PUBLIC_POSTHOG_KEY) {
      posthog.init(PUBLIC_POSTHOG_KEY, {
        api_host: PUBLIC_POSTHOG_BASE_URL,
        ui_host: "https://us.posthog.com",
        // set to 'always' to create profiles for anonymous users as well
        person_profiles: "always",
        // Disable automatic pageview capture, as we capture manually
        capture_pageview: false,
        persistence:
          getAnalyticsCookieConsentGiven() === "yes"
            ? "localStorage+cookie"
            : "memory",
        loaded: () => {
          setIsMounted(true);
        },
        on_request_error: () => {
          setIsMounted(true);
        },
      });
    } else {
      setIsMounted(true);
    }
  }, []);

  // Fix posthog usage before the initialization is complete
  if (!isMounted) {
    return null;
  }

  return (
    <PostHogProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PostHogProvider>
  );
}

interface TranslationsBannerContextProps {
  bannerIsVisible: boolean;
  setBannerIsVisible: (a: boolean) => void;
}
const TranslationsBannerContext = createContext<TranslationsBannerContextProps>(
  { bannerIsVisible: false, setBannerIsVisible: () => {} }
);

export const TranslationsBannerProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [bannerIsVisible, setBannerIsVisible] = useState(false);
  return (
    <TranslationsBannerContext.Provider
      value={{ setBannerIsVisible, bannerIsVisible }}
    >
      {children}
    </TranslationsBannerContext.Provider>
  );
};

export const useContentTranslatedBannerProvider = () =>
  useContext(TranslationsBannerContext);
