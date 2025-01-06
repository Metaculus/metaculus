import { faFile, faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import ProfileApi from "@/services/profile";
import cn from "@/utils/cn";

import GlobalHeader from "../../(main)/components/headers/global_header";
import { Hero, Dates, Prize } from "./components/hero-section";
import { RegisterAndStatus } from "./components/registration-status";

export const metadata = {
  title: "Bridgewater x Metaculus",
  description:
    "Register to forecast, explore opportunities with Bridgewater Associates, and compete for $25,000 in prizes!",
};

const buttonLinks = [
  {
    icon: faCoffee,
    text: "Warmup Questions",
    url: "/tournament/bridgewater-warmup/",
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
        "rounded bg-gray-0 p-5 text-sm dark:bg-gray-0-dark md:p-8 md:text-lg md:font-medium lg:text-xl",
        className
      )}
    >
      <p>
        For the second year, Metaculus is teaming up with Bridgewater—
        <span className="italic">a premier asset management firm</span>— for a
        unique forecasting competition. No experience necessary. Just register
        today, and starting February 3rd, make your predictions on a wide range
        of topics!
      </p>
      <p className="font-bold">
        The most accurate forecasters will be eligible for $25,000 in prizes and
        potential opportunities with Bridgewater.
      </p>
      <p>
        Register for the contest today and be notified as soon as questions
        open. The earlier you forecast, the better your odds to beat the
        competition and win cash prizes!
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
          className="flex grow flex-col items-center justify-between gap-4 rounded bg-white p-4 text-center no-underline transition-all hover:bg-blue-500/40 dark:bg-blue-100-dark dark:hover:bg-blue-600/40  xl:items-start min-[1920px]:gap-6"
        >
          <FontAwesomeIcon
            icon={button.icon}
            className="text-xl text-blue-700 dark:text-blue-700-dark"
          />
          <span className="block text-center text-base no-underline ">
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
      <main className="mt-12 flex min-h-screen flex-col items-center justify-start p-3 sm:p-5">
        <div className="flex size-full flex-col items-center gap-2">
          <div className="flex w-full flex-col gap-3 lg:flex-row">
            <div className="w-full self-stretch">
              <Hero />
            </div>
            <div className="flex w-full flex-row gap-3 lg:flex-col xl:flex-row">
              <Dates />
              <Prize />
            </div>
          </div>

          <div className="min-h-[147px] w-full shrink-0 rounded bg-[url('https://metaculus-media.s3.amazonaws.com/Cover-no-logos-wide-8Ak6wNueS-transformed.webp')] bg-cover bg-center lg:min-h-[178px] xl:min-h-[264px]"></div>

          <div className="flex grow flex-wrap gap-3 xl:flex-nowrap">
            <DescriptionParagraphs className="grow basis-full sm:basis-[45%] xl:basis-[20%]" />

            <RegisterAndStatus
              className="grow basis-full sm:basis-[45%] xl:basis-[20%]"
              currentUser={currentUser}
            />

            <UtilLinks className=" grow  basis-full xl:basis-[20%]" />
          </div>
        </div>
      </main>
    </>
  );
}
