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
} from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

export function CSPostHogProvider({ children }: { children: any }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_BASE_URL,
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_BASE_URL,
      // set to 'always' to create profiles for anonymous users as well
      person_profiles: "identified_only",
      // Disable automatic pageview capture, as we capture manually
      capture_pageview: false,
      persistence:
        getAnalyticsCookieConsentGiven() === "yes"
          ? "localStorage+cookie"
          : "memory",
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

interface TranslationsBannerContextProps {
  bannerIsVissible: boolean;
  setBannerisVisible: (a: boolean) => void;
}
const TranslationsBannerContext = createContext<TranslationsBannerContextProps>(
  { bannerIsVissible: false, setBannerisVisible: (a) => {} }
);

export const TranslationsBannerProvider: FC<PropsWithChildren<{}>> = ({
  children,
}) => {
  const [bannerIsVissible, setBannerisVisible] = useState(false);
  return (
    <TranslationsBannerContext.Provider
      value={{ setBannerisVisible, bannerIsVissible }}
    >
      {children}
    </TranslationsBannerContext.Provider>
  );
};

export const useContentTranslatedBannerProvider = () =>
  useContext(TranslationsBannerContext);
