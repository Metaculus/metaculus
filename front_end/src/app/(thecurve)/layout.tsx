import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import type { Metadata } from "next";

import { defaultDescription } from "@/constants/metadata";
import SurveyProvider from "@/contexts/survey_context";

import CurveHeader from "./components/curve_header";
import Bulletins from "../(main)/components/bulletins";
import CookiesBanner from "../(main)/components/cookies_banner";

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
  return (
    <div className="flex min-h-screen flex-col">
      <SurveyProvider>
        {/* <CurveHeader /> */}
        <Bulletins />
        <div className="flex flex-grow">{children}</div>
        <CookiesBanner />
      </SurveyProvider>
    </div>
  );
}
