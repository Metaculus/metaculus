import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import FeedbackFloat from "./(home)/components/feedback_float";
import Bulletins from "./components/bulletins";
import CookiesBanner from "./components/cookies_banner";
import Footer from "./components/footer";
import GlobalHeader from "./components/headers/global_header";

config.autoAddCss = false;

export const defaultDescription =
  "Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.";

export const metadata: Metadata = {
  title: "Metaculus",
  description: defaultDescription,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader />
      <Bulletins />
      <div className="flex-grow">{children}</div>
      <FeedbackFloat />
      <Footer />
      <CookiesBanner />
    </div>
  );
}
