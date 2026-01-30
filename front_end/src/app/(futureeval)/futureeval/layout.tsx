import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import CookiesBanner from "@/app/(main)/components/cookies_banner";
import VersionChecker from "@/app/(main)/components/version_checker";
import { defaultDescription } from "@/constants/metadata";

import FutureEvalFooter from "./components/futureeval-footer";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "FutureEval | Metaculus",
  description: defaultDescription,
};

/**
 * FutureEval Layout
 *
 * This layout removes the global header and footer for a cleaner FutureEval experience.
 * FutureEval pages use their own navbar (FutureEvalNavbar) instead.
 */
export default function FutureEvalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-grow">{children}</div>
      <FutureEvalFooter />
      <CookiesBanner />
      <VersionChecker />
    </div>
  );
}
