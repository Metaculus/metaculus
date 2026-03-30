import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import { defaultDescription } from "@/constants/metadata";

import StorefrontFooter from "./components/storefront_footer";
import FeedbackFloat from "../(main)/(home)/components/feedback_float";
import CookiesBanner from "../(main)/components/cookies_banner";
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
      <StorefrontFooter />
      <CookiesBanner />
      <VersionChecker />
    </div>
  );
}
