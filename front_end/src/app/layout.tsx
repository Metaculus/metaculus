import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;
import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import Header from "@/app/header";

const sourceSerifPro = localFont({
  src: [
    {
      path: "./fonts/SourceSerifPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SourceSerifPro-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/SourceSerifPro-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/SourceSerifPro-Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/SourceSerifPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/SourceSerifPro-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/SourceSerifPro-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/SourceSerifPro-BoldItalic.woff",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-source-serif-pro",
});
const diatype = localFont({
  src: [
    {
      path: "./fonts/ABCDiatype-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/ABCDiatype-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-diatype",
});
const diatypeVariable = localFont({
  src: [
    {
      path: "./fonts/ABCDiatypeVariable.woff2",
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

  return (
    <html
      lang={locale}
      className={`${diatypeVariable.variable} ${diatype.variable} ${sourceSerifPro.variable} font-sans`}
    >
      <body className="bg-metac-blue-200 dark:bg-metac-blue-50-dark">
        <NextIntlClientProvider messages={messages}>
          <Header />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
