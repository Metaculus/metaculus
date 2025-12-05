import { Metadata } from "next";

import GlobalHeader from "@/app/(main)/components/headers/global_header";
import ServerProfileApi from "@/services/api/profile/profile.server";

import DescriptionBlock from "./components/description-block";
import FooterLinks from "./components/footer-links";
import HeaderBlock from "./components/header-block";
import RegistrationContainer from "./components/registration-container";

export const metadata: Metadata = {
  title: "Bridgewater x Metaculus Forecasting Contest",
  description:
    "Register to forecast, explore opportunities with Bridgewater Associates, and compete for $30,000 in prizes!",
};

/**
 * Main Bridgewater landing page
 * Built using tournament/project page patterns with static data
 */
export default async function BridgewaterLandingPage() {
  const currentUser = await ServerProfileApi.getMyProfile();

  return (
    <>
      <GlobalHeader />
      <main className="mx-auto mb-16 mt-[48px] flex min-h-min w-full max-w-[780px] flex-auto flex-col gap-3 px-0 sm:mt-[90px]">
        {/* Header with hero image and key info */}
        <HeaderBlock />

        {/* Registration Steps or Eligibility Status */}
        <div className="flex flex-col gap-3 px-3 sm:px-0">
          <RegistrationContainer currentUser={currentUser} />

          {/* Description */}
          <DescriptionBlock />

          {/* Footer Links */}
          <FooterLinks />
        </div>
      </main>
    </>
  );
}
