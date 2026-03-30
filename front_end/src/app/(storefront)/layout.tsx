import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import { defaultDescription } from "@/constants/metadata";

import FeedbackFloat from "../(main)/(home)/components/feedback_float";
import CookiesBanner from "../(main)/components/cookies_banner";
import Footer from "../(main)/components/footer";
import VersionChecker from "../(main)/components/version_checker";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "Metaculus",
  description: defaultDescription,
};

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="force-light flex min-h-screen flex-col bg-blue-200">
      <div className="flex-grow">{children}</div>
      <FeedbackFloat />
      <Footer hideSelectors />
      <CookiesBanner />
      <VersionChecker />
    </div>
  );
}
