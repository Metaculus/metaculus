import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";

import Announcement from "./components/announcement";
import Dates from "./components/dates";
import Disclaimer from "./components/disclaimer";
import Hero from "./components/hero";
import OpenLeaderboard from "./components/openLeaderboard";
import Prize from "./components/prize";
import UndergradLeaderboard from "./components/undergradLeaderboard";
import GlobalHeader from "../../../../(main)/components/headers/global_header";

export const metadata = {
  title: "Bridgewater | Metaculus",
  description:
    "Bridgewater Associates and Metaculus have teamed up for an exciting new forecasting competition!",
};

export default function BridgewaterTournamentPage() {
  return (
    <>
      <GlobalHeader />
      <main className="mt-12 flex h-fit flex-col items-center justify-start p-3 sm:p-5">
        <div className="flex size-full flex-col items-center">
          <div className="flex w-full flex-col gap-3 md:flex-row">
            <div className="flex w-full flex-col gap-3 md:w-1/2 lg:flex-row">
              <Hero />
              <div className="relative flex size-full min-h-[8rem] flex-row overflow-hidden rounded lg:h-auto lg:w-1/2">
                <Image
                  src="https://metaculus-media.s3.amazonaws.com/Cover-no-logos-wide-8Ak6wNueS-transformed.webp"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-1/2 lg:flex-row">
              <Dates />
              <Prize />
            </div>
          </div>
          <div className="mt-3 flex w-full flex-col">
            <Announcement />
          </div>
          <div className="my-3 flex w-full flex-col-reverse gap-3 lg:flex-row-reverse">
            <div className="flex w-full gap-3 lg:w-1/4">
              <div className="flex size-full flex-row gap-3 lg:flex-col">
                <Link
                  href="/tournament/bridgewater/"
                  className="flex size-full h-auto flex-col items-start justify-center gap-4 rounded bg-white p-4 text-center no-underline transition-all hover:bg-blue-500/40 dark:bg-blue-100-dark dark:hover:bg-blue-600/40 md:h-full md:p-5 lg:justify-center min-[1920px]:gap-6 min-[1920px]:p-8"
                >
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="self-center text-3xl text-blue-700 dark:text-blue-700-dark md:text-2xl lg:self-start min-[1920px]:text-5xl"
                  />
                  <span className="block self-center text-center text-base text-blue-700 no-underline md:text-xl lg:self-start lg:text-left min-[1920px]:text-3xl">
                    View Contest Page
                  </span>
                </Link>
              </div>
            </div>
            <div className="flex size-full flex-col gap-3 md:flex-row">
              <OpenLeaderboard />
              <UndergradLeaderboard />
            </div>
          </div>
          <div className="flex w-full flex-col gap-3">
            <Disclaimer />
          </div>
        </div>
      </main>
    </>
  );
}
