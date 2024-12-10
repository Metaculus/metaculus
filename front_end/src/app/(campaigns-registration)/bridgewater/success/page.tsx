import ProfileApi from "@/services/profile";
import Header from "../components/header";
import { redirect } from "next/navigation";
import { SuccessAndVerifyEmail } from "../components/cards";
import { CAMPAIGN_KEY, CAMPAIGN_URL_BASE_PATH } from "../constants";

export default async function Page({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
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
            <SuccessAndVerifyEmail email={searchParams?.email} />
          </div>
        </div>
      </main>
    </>
  );
}
