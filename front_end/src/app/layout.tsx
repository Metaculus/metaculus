import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";

import GlobalModals from "@/components/global_modals";
import OnboardingModalWrapper from "@/components/onboarding/OnboardingModalWrapper";
import AppThemeProvided from "@/components/theme_provider";
import { METAC_COLORS } from "@/constants/colors";
import AuthProvider from "@/contexts/auth_context";
import ModalProvider from "@/contexts/modal_context";
import AuthApi from "@/services/auth";
import ProfileApi from "@/services/profile";

import { CSPostHogProvider } from "./providers";

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
  return {
    title: "Metaculus",
    description: "Metaculus",
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    ),
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

  return (
    <html
      lang={locale}
      className={`${interVariable.variable} ${inter.variable} ${sourceSerifPro.variable} ${leagueGothic.variable} !pe-0 font-sans [scrollbar-gutter:stable]`}
      // required by next-themes
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <CSPostHogProvider>
        <body className="min-h-screen w-full bg-blue-200 dark:bg-blue-50-dark">
          <AppThemeProvided>
            <NextIntlClientProvider messages={messages}>
              <AuthProvider user={user}>
                <ModalProvider>
                  <NextTopLoader
                    showSpinner={false}
                    color={METAC_COLORS.blue["500"].DEFAULT}
                  />
                  {children}
                  <GlobalModals />
                  <OnboardingModalWrapper />
                  <Toaster />
                </ModalProvider>
              </AuthProvider>
            </NextIntlClientProvider>
          </AppThemeProvided>
        </body>
        {!!process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID && (
          <GoogleAnalytics
            gaId={process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID}
          />
        )}
      </CSPostHogProvider>
    </html>
  );
}
