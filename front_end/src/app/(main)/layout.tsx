import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import ShowActiveCommunityProvider from "@/app/(main)/c/components/community_context";
import { defaultDescription } from "@/constants/metadata";
import { PrintOverrideProvider } from "@/contexts/theme_override_context";
import { getPublicSettings } from "@/utils/public_settings.server";

import FeedbackFloat from "./(home)/components/feedback_float";
import CookiesBanner from "./components/cookies_banner";
import Footer from "./components/footer";
import { TopChrome } from "./components/top_chrome";
import { TopChromeHeaderProvider } from "./components/top_chrome_header_context";
import { resolveInitialTopChromeHeaderState } from "./components/top_chrome_header_server";
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
  const initialHeaderState = await resolveInitialTopChromeHeaderState();

  return (
    <PrintOverrideProvider>
      <ShowActiveCommunityProvider>
        <TopChromeHeaderProvider initialHeaderState={initialHeaderState}>
          <div className="flex min-h-screen flex-col pt-header print:pt-0">
            <TopChrome />
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
        </TopChromeHeaderProvider>
      </ShowActiveCommunityProvider>
    </PrintOverrideProvider>
  );
}
