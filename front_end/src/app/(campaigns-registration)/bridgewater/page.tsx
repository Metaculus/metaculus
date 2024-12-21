import ProfileApi from "@/services/profile";
import Header from "./components/header";
import { SucessfullyRegistered } from "./components/cards";
import { redirect } from "next/navigation";
import { ChoicesButtons, HeroSection } from "./components/hero-section";
import { CAMPAIGN_KEY, CAMPAIGN_URL_BASE_PATH } from "./constants";
import Link from "next/link";

export const metadata = {
  title: "Bridgewater x Metaculus",
  description:
    "Register to forecast, explore opportunities with Bridgewater Associates, and compete for $25,000 in prizes!",
};

export default async function Page() {
  const user = await ProfileApi.getMyProfile();

  if (user && user.registered_campaign_keys.includes(CAMPAIGN_KEY)) {
    return (
      <>
        <>
          <Header />
          <main className="flex flex-grow justify-center">
            <HeroSection className="m-5 w-full max-w-[896px] pb-10">
              <div className="flex w-full flex-col items-center px-5">
                <SucessfullyRegistered />
              </div>
            </HeroSection>
          </main>
        </>
      </>
    );
  } else if (user) {
    redirect(`${CAMPAIGN_URL_BASE_PATH}/register`);
  }

  return (
    <>
      <Header />
      <main className="mt-4 flex flex-col items-center justify-center p-3 sm:p-5 ">
        <HeroSection className="m-5 w-full max-w-[896px]">
          <div className="w-full px-5">
            <ChoicesButtons />
          </div>
        </HeroSection>

        <div className="mx-8 text-blue-800 dark:text-blue-800-dark sm:mx-12 md:max-w-[670px]">
          <p>
            For the second year, Metaculus is teaming up with Bridgewater - a
            premier asset management firm - for a unique forecasting
            competition. No experience necessary. Just register today, and
            starting February 3rd, make your predictions on a wide range of
            topics!
          </p>
          <p>
            The most accurate forecasters will be eligible for $25,000 in prizes
            and potential opportunities with{" "}
            <Link href={"https://www.bridgewater.com/"}>Bridgewater.</Link>
          </p>
          <p>
            Register for the contest and be notified as soon as questions open.
            The earlier you forecast, the better your odds to beat the
            competition and win cash prizes!
          </p>
          <p>
            <i>
              Curious to see the questions, winners, and schools represented in
              the previous Bridgewater x Metaculus contest? Find them{" "}
              <Link href={"https://www.metaculus.com/tournament/bridgewater/"}>
                here.
              </Link>
              .
            </i>
          </p>
        </div>
      </main>
    </>
  );
}
