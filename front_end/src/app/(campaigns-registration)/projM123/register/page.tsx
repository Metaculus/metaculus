import ProfileApi from "@/services/profile";
import { AlreadyRegisteredCard } from "../components/cards";
import Header from "../components/header";
import { RegistrationPage } from "../components/registration-forms";
import { Heading1, Heading2 } from "../components/typography";

export default async function Page() {
  const user = await ProfileApi.getMyProfile();

  if (user && user.registered_campaign_keys.indexOf("projM123") >= 0) {
    return (
      <>
        <Header />
        <main className="flex flex-grow justify-center">
          <div className="mt-16 flex size-full flex-col items-center">
            <Heading1>ProjectM123</Heading1>
            <AlreadyRegisteredCard />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex flex-grow justify-center">
        <div className="mt-16 flex size-full flex-col items-center">
          <Heading1>ProjectM123</Heading1>
          <Heading2>Register for project M123</Heading2>
          <div className="mt-6">
            <RegistrationPage campaignKey="projM123" />
          </div>
        </div>
      </main>
    </>
  );
}
