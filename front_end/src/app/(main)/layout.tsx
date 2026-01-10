import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import { defaultDescription } from "@/constants/metadata";
import { getImpersonatorSession } from "@/services/session";
import { getPublicSettings } from "@/utils/public_settings.server";

import FeedbackFloat from "./(home)/components/feedback_float";
import Bulletins from "./components/bulletins";
import CookiesBanner from "./components/cookies_banner";
import Footer from "./components/footer";
import GlobalHeader from "./components/headers/global_header";
import ImpersonationBanner from "./components/impersonation_banner";
import VersionChecker from "./components/version_checker";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Metaculus",
  description: defaultDescription,
};

const { PUBLIC_MINIMAL_UI } = getPublicSettings();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const impersonatorToken = await getImpersonatorSession();

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />

      {impersonatorToken && <ImpersonationBanner />}

      <Bulletins />
      <div className="flex-grow">{children}</div>
      {!PUBLIC_MINIMAL_UI && (
        <>
          <FeedbackFloat />
          <Footer />
        </>
      )}
      <CookiesBanner />
      <VersionChecker />
    </div>
  );
}
