import { faFile, faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import ProfileApi from "@/services/profile";
import cn from "@/utils/cn";

import { Hero, Dates, Prize } from "./components/hero-section";
import { RegisterAndStatus } from "./components/registration-status";
import GlobalHeader from "../../(main)/components/headers/global_header";

export const metadata = {
  title: "Bridgewater x Metaculus",
  description:
    "Register to forecast, explore opportunities with Bridgewater Associates, and compete for $25,000 in prizes!",
};

const buttonLinks = [
  {
    icon: faTrophy,
    text: "Tournament Page",
    url: "/tournament/bridgewater/",
  },
  {
    icon: faQuestionCircle,
    text: "Learn how it works",
    url: "how-it-works",
  },
  {
    icon: faFile,
    text: "Contest Rules",
    url: "contest-rules",
  },
];

const DescriptionParagraphs: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        "rounded bg-gray-0 p-5 text-sm text-blue-800 dark:bg-gray-0-dark dark:text-blue-800-dark md:p-8 md:text-base md:font-medium lg:text-lg  min-[1920px]:p-12 min-[1920px]:text-xl",
        className
      )}
    >
      <p className="mt-0 font-normal leading-normal md:font-light">
        Metaculus and Bridgewater Associates are partnering again on a unique
        forecasting competition. Starting February 3rd, forecasters of all
        experience levels can share their predictions across a variety of
        questions.
      </p>
      <p className="font-semibold leading-normal">
        The most accurate forecasters will be eligible for $25,000 in prizes and
        potential opportunities with Bridgewater. Last competition, multiple
        offers were made to the top forecasters.
      </p>
      <p className="mb-0 font-normal leading-normal md:font-light">
        The competition features two tracks: an undergraduate track for current
        students and an open track for all participants. Register today and be
        notified as soon as questions open. The earlier you forecast, the better
        your odds to beat the competition and win cash prizes!
      </p>
    </div>
  );
};

const UtilLinks: FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn("flex flex-col gap-3 sm:flex-row xl:flex-col", className)}
    >
      {" "}
      {buttonLinks.map((button) => (
        <a
          target="_blank"
          key={button.text}
          href={button.url}
          className="flex grow flex-col items-center justify-between gap-4 rounded bg-white p-4 text-center no-underline transition-all hover:bg-blue-500/40 dark:bg-blue-100-dark dark:hover:bg-blue-600/40 lg:p-5  xl:items-start min-[1920px]:gap-6"
        >
          <FontAwesomeIcon
            icon={button.icon}
            className="text-xl text-blue-700 dark:text-blue-700-dark xl:text-2xl"
          />
          <span className="block text-center text-base text-blue-700 no-underline dark:text-blue-700-dark xl:text-xl">
            {button.text}
          </span>
        </a>
      ))}
    </div>
  );
};

export default async function Page() {
  const currentUser = await ProfileApi.getMyProfile();

  return (
    <>
      <GlobalHeader />
      <main className="mt-12 flex h-fit min-h-screen flex-col items-center justify-start p-3 sm:p-5">
        <div className="flex size-full h-auto flex-col items-center gap-2 md:h-fit md:min-h-[calc(100vh-80px)]">
          <div className="flex w-full flex-col gap-3 lg:flex-row">
            <div className="w-full self-stretch">
              <Hero />
            </div>
            <div className="flex w-full flex-row gap-3 lg:flex-col xl:flex-row">
              <Dates />
              <Prize />
            </div>
          </div>

          <div className="min-h-[147px] w-full shrink-0 rounded bg-[url('https://metaculus-media.s3.amazonaws.com/Cover-no-logos-wide-8Ak6wNueS-transformed.webp')] bg-cover bg-center lg:min-h-[178px] xl:min-h-[244px] min-[1920px]:min-h-[344px]"></div>

          <div className="flex flex w-full flex-col items-center items-center justify-center justify-center gap-2 text-balance rounded-md bg-purple-200 p-3 text-center text-base text-purple-800 dark:bg-purple-200-dark dark:text-purple-800-dark md:flex-row md:gap-4 md:p-6 md:text-xl">
            <FontAwesomeIcon
              icon={faTrophy}
              className="text-lg md:text-lg min-[1920px]:text-xl"
            />{" "}
            Last day to register is March 24!
          </div>
          <div className="flex w-full grow flex-wrap gap-3 xl:flex-nowrap">
            <DescriptionParagraphs className="w-full" />

            <RegisterAndStatus className="w-full" currentUser={currentUser} />

            <UtilLinks className="w-full" />
          </div>
        </div>
      </main>
    </>
  );
}
