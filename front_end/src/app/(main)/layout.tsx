import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import { defaultDescription } from "@/constants/metadata";

import FeedbackFloat from "./(home)/components/feedback_float";
import Bulletins from "./components/bulletins";
import CookiesBanner from "./components/cookies_banner";
import Footer from "./components/footer";
import GlobalHeader from "./components/headers/global_header";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Metaculus",
  description: defaultDescription,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const minimalUI =
    (process.env.NEXT_PUBLIC_MINIMAL_UI || "false").toLowerCase() === "true";
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />
      <Bulletins />
      <div className="flex-grow">{children}</div>
      {!minimalUI && (
        <>
          <FeedbackFloat />
          <Footer />
        </>
      )}
      <CookiesBanner />
    </div>
  );
}
