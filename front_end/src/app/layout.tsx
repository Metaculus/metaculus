import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";

import GlobalModals from "@/components/global_modals";
import PublicSettingsScript from "@/components/public_settings_script";
import AppThemeProvider from "@/components/theme_provider";
import { METAC_COLORS } from "@/constants/colors";
import AuthProvider from "@/contexts/auth_context";
import CookiesProvider from "@/contexts/cookies_context";
import { GlobalSearchProvider } from "@/contexts/global_search_context";
import ModalProvider from "@/contexts/modal_context";
import NavigationProvider from "@/contexts/navigation_context";
import PolyfillProvider from "@/contexts/polyfill";
import CSPostHogProvider from "@/contexts/posthog_context";
import PublicSettingsProvider from "@/contexts/public_settings_context";
import { TranslationsBannerProvider } from "@/contexts/translations_banner_context";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { CurrentUser } from "@/types/users";
import { logError } from "@/utils/core/errors";
import { getFontsString } from "@/utils/fonts";
import { getPublicSettings } from "@/utils/public_settings.server";

config.autoAddCss = false;

export async function generateMetadata(): Promise<Metadata> {
  const publicSettings = getPublicSettings();

  return {
    title: "Metaculus",
    description: "Metaculus",
    openGraph: {
      images: {
        width: 720,
        height: 720,
        url: "/images/default_preview.png",
        alt: "Metaculus",
      },
    },
    twitter: {
      images: {
        width: 720,
        height: 720,
        url: "/images/default_preview.png",
        alt: "Metaculus",
      },
    },
    metadataBase: new URL(publicSettings.PUBLIC_APP_URL),
    robots: publicSettings.PUBLIC_DISALLOW_ALL_BOTS
      ? { index: false, follow: true }
      : null,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  let user: CurrentUser | null = null;
  try {
    user = await ServerProfileApi.getMyProfile();
  } catch (err) {
    logError(err);
  }

  const publicSettings = getPublicSettings();

  return (
    <html
      lang={locale}
      className={`${getFontsString()} !pe-0 font-sans [scrollbar-gutter:stable]`}
      // required by next-themes
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <head>
        {/* Add the Cookiebot script if the ID is set */}
        {!!publicSettings.PUBLIC_COOKIEBOT_ID && (
          <>
            <Script
              id="CookiebotCallback_OnDialogDisplay"
              strategy="beforeInteractive"
            >
              {`
                  CookiebotCallback_OnDialogDisplay = function () {
                    // This is a hack to hide the banner right before it is displayed. We only need to do it once, when the
                    // page loads but there is no other way to do so besides this callback which is called
                    // whenever the banner is displayed.
                    // But we do want to be able to display the banner again if the user clicks on the advanced,
                    // settings button, so we need to guard the hide call.
                    if (!window.CookiebotFirsttimeHide) {
                      window.CookiebotFirsttimeHide = true;
                      window.Cookiebot.hide();
                    }
                  };
              `}
            </Script>
            <Script
              id="Cookiebot"
              src="https://consent.cookiebot.com/uc.js"
              data-cbid={publicSettings.PUBLIC_COOKIEBOT_ID}
              strategy="beforeInteractive"
            />
          </>
        )}

        <PublicSettingsScript publicSettings={publicSettings} />
        {/* Set default consent mode before GA loads */}
        <Script
          id="default-consent"
          strategy="beforeInteractive"
          type="text/plain"
          data-cookieconsent="statistics"
        >
          {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){ 
                dataLayer.push(arguments); 
              }
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
              });
            `}
        </Script>
      </head>
      <body
        className="min-h-screen w-full bg-blue-200 dark:bg-blue-50-dark"
        suppressHydrationWarning
      >
        <PolyfillProvider>
          <CookiesProvider>
            <CSPostHogProvider locale={locale}>
              <AppThemeProvider>
                <NextIntlClientProvider messages={messages}>
                  <AuthProvider user={user} locale={locale}>
                    <PublicSettingsProvider settings={publicSettings}>
                      <ModalProvider>
                        <NavigationProvider>
                          <GlobalSearchProvider>
                            <TranslationsBannerProvider>
                              <NextTopLoader
                                showSpinner={false}
                                color={METAC_COLORS.blue["500"].DEFAULT}
                              />
                              {children}
                              <GlobalModals />
                              <Toaster />
                            </TranslationsBannerProvider>
                          </GlobalSearchProvider>
                        </NavigationProvider>
                      </ModalProvider>
                    </PublicSettingsProvider>
                  </AuthProvider>
                </NextIntlClientProvider>
              </AppThemeProvider>
            </CSPostHogProvider>
          </CookiesProvider>
        </PolyfillProvider>
      </body>
      {!!publicSettings.PUBLIC_GOOGLE_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={publicSettings.PUBLIC_GOOGLE_MEASUREMENT_ID} />
      )}
    </html>
  );
}
