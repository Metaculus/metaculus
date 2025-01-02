import { redirect } from "next/navigation";

import ProfileApi from "@/services/profile";

import Header from "../components/header";
import { ContestHeader } from "../components/hero-section";
import { RegistrationPage } from "../components/registration-forms";
import { CAMPAIGN_KEY, CAMPAIGN_URL_BASE_PATH } from "../constants";

export default async function Page() {
  const user = await ProfileApi.getMyProfile();

  if (user && user.registered_campaign_keys.includes(CAMPAIGN_KEY)) {
    redirect(CAMPAIGN_URL_BASE_PATH);
  }

  return (
    <>
      <Header />
      <main className="flex flex-grow justify-center">
        <div className="mt-10 flex size-full flex-col items-center">
          <div className="max-w-[629px]">
            <ContestHeader />
            <div className="mt-6 w-full">
              <RegistrationPage campaignKey={CAMPAIGN_KEY} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
