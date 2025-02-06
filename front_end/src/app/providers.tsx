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

export function CSPostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.PUBLIC_POSTHOG_KEY, {
        api_host: process.env.PUBLIC_POSTHOG_BASE_URL,
        ui_host: process.env.PUBLIC_POSTHOG_BASE_URL,
        // set to 'always' to create profiles for anonymous users as well
        person_profiles: "identified_only",
        // Disable automatic pageview capture, as we capture manually
        capture_pageview: false,
        persistence:
          getAnalyticsCookieConsentGiven() === "yes"
            ? "localStorage+cookie"
            : "memory",
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
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
