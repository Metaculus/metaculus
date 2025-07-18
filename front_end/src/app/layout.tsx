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
        <PublicSettingsScript publicSettings={publicSettings} />
        {/* Set default consent mode before GA loads */}
        <Script id="default-consent" strategy="beforeInteractive">
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
      <body className="min-h-screen w-full bg-blue-200 dark:bg-blue-50-dark">
        <PolyfillProvider>
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
        </PolyfillProvider>
      </body>
      {!!publicSettings.PUBLIC_GOOGLE_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={publicSettings.PUBLIC_GOOGLE_MEASUREMENT_ID} />
      )}
    </html>
  );
}
