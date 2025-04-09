import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";

import ChunkRetryScript from "@/components/chunk_retry_script";
import GlobalModals from "@/components/global_modals";
import PublicSettingsScript from "@/components/public_settings_script";
import AppThemeProvided from "@/components/theme_provider";
import { METAC_COLORS } from "@/constants/colors";
import AuthProvider from "@/contexts/auth_context";
import { GlobalSearchProvider } from "@/contexts/global_search_context";
import ModalProvider from "@/contexts/modal_context";
import NavigationProvider from "@/contexts/navigation_context";
import PolyfillProvider from "@/contexts/polyfill";
import PublicSettingsProvider from "@/contexts/public_settings_context";
import ProfileApi from "@/services/profile";
import { getPublicSettings } from "@/utils/public_settings.server";

import { CSPostHogProvider, TranslationsBannerProvider } from "./providers";

config.autoAddCss = false;

const sourceSerifPro = localFont({
  src: [
    {
      path: "../../public/fonts/SourceSerifPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/SourceSerifPro-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/SourceSerifPro-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-source-serif-pro",
});

const inter = localFont({
  src: [
    {
      path: "../../public/fonts/inter_18pt-medium.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/inter_18pt-mediumitalic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-inter",
});

const interVariable = localFont({
  src: [
    {
      path: "../../public/fonts/inter_variable.ttf",
      weight: "100 700",
      style: "normal",
    },
  ],
  variable: "--font-inter-variable",
});

const leagueGothic = localFont({
  src: "../../public/fonts/league_gothic_variable.ttf",
  variable: "--font-league-gothic",
});

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
  const user = await ProfileApi.getMyProfile();
  const publicSettings = getPublicSettings();

  return (
    <html
      lang={locale}
      className={`${interVariable.variable} ${inter.variable} ${sourceSerifPro.variable} ${leagueGothic.variable} !pe-0 font-sans [scrollbar-gutter:stable]`}
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
          <CSPostHogProvider>
            <AppThemeProvided>
              <NextIntlClientProvider messages={messages}>
                <AuthProvider user={user}>
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
            </AppThemeProvided>
          </CSPostHogProvider>
        </PolyfillProvider>
      </body>
      {!!publicSettings.PUBLIC_GOOGLE_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={publicSettings.PUBLIC_GOOGLE_MEASUREMENT_ID} />
      )}
      <ChunkRetryScript />
    </html>
  );
}
