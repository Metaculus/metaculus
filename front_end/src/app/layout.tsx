import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";

import Header from "@/app/header";
import GlobalModals from "@/components/global_modals";
import AuthProvider from "@/contexts/auth_context";
import ModalProvider from "@/contexts/modal_context";
import AuthApi from "@/services/auth";
import ProfileApi from "@/services/profile";

config.autoAddCss = false;

const sourceSerifPro = localFont({
  src: [
    {
      path: "./assets/fonts/SourceSerifPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assets/fonts/SourceSerifPro-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assets/fonts/SourceSerifPro-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./assets/fonts/SourceSerifPro-Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./assets/fonts/SourceSerifPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./assets/fonts/SourceSerifPro-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./assets/fonts/SourceSerifPro-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./assets/fonts/SourceSerifPro-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-source-serif-pro",
});
const diatype = localFont({
  src: [
    {
      path: "./assets/fonts/ABCDiatype-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./assets/fonts/ABCDiatype-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-diatype",
});
const diatypeVariable = localFont({
  src: [
    {
      path: "./assets/fonts/ABCDiatypeVariable.woff2",
      weight: "100 700",
      style: "normal",
    },
  ],
  variable: "--font-diatype-variable",
});

export const metadata: Metadata = {
  title: "Metaculus",
  description: "Metaculus rewrite",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const user = await ProfileApi.getMyProfile();
  const currentUrl = new URL(headers().get("x-url")!);
  const socialProviders = await AuthApi.getSocialProviders(
    `${currentUrl.origin}/accounts/social`
  );

  return (
    <html
      lang={locale}
      className={`${diatypeVariable.variable} ${diatype.variable} ${sourceSerifPro.variable} font-sans`}
      // required by next-themes
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <body className="min-h-screen w-full bg-blue-200 dark:bg-blue-50-dark">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider user={user} socialProviders={socialProviders}>
              <ModalProvider>
                <Header />
                <div className="pt-12 ">{children}</div>
                <GlobalModals />
              </ModalProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
