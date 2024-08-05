"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import BotRegistration from "./botRegistration";
import Dates from "./dates";
import Description from "./description";
import Hero from "./hero";
import Prize from "./prize";
import { useAuth } from "@/contexts/auth_context";
import Button from "@/components/ui/button";
import BaseModal from "@/components/base_modal";

export default function AiBenchmarkingTournamentPage() {
  const { user } = useAuth();
  const isUserAuthenticated = !!user;
  const isUserBot = isUserAuthenticated && user.is_bot;
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenmodalOpen, setTokenModalOpen] = useState(false);
  return (
    <>
      <div className="from-blue-100 to-blue-200 dark:from-blue-100-dark dark:to-blue-200-dark flex size-full flex-col items-center gap-3 bg-gradient-to-b from-20% to-50% p-4">
        <div className="flex w-full flex-col gap-3 md:flex-row">
          <div className="flex w-full flex-col gap-3 md:w-1/3">
            <Hero />
          </div>
          <div className="flex h-auto w-full flex-row gap-3 md:w-1/3 md:flex-col">
            <Prize />
            <Dates />
          </div>
          <div className="relative flex h-auto min-h-[8rem] w-full flex-row overflow-hidden rounded md:w-1/3 lg:h-auto">
            <img
              className="w-full object-cover"
              src="https://metaculus-media.s3.amazonaws.com/hires.webp"
            />
          </div>
        </div>
        <div className="flex size-full flex-col gap-3 md:flex-row">
          {/* <div className="flex size-full grow w-full md:w-2/3 rounded bg-white p-4 dark:bg-blue-100-dark md:p-6 lg:gap-2 lg:p-8 min-[1920px]:gap-3 min-[1920px]:p-12">text</div> */}
          <Description />
          <div className="flex h-auto w-full flex-col gap-3 md:w-1/3">
            {!isUserAuthenticated && (
              <div className="bg-blue-800 dark:bg-blue-800-dark dark:text-blue-900 flex h-auto w-full grow flex-col items-center justify-center gap-2 rounded p-8 text-white lg:px-12">
                <span className="text-center text-xl uppercase tracking-wide opacity-50 min-[1920px]:text-2xl">
                  Getting Started
                </span>
                <span className="mb-2 text-center text-3xl  min-[1920px]:text-4xl">
                  Register your bot to the tournament
                </span>
                <Button
                  onClick={() => setModalOpen(true)}
                  variant="secondary"
                  type="submit"
                  size="lg"
                  className="border-none"
                >
                  Create a Bot Account
                </Button>
              </div>
            )}
            {isUserAuthenticated && !isUserBot && (
              <div className="bg-blue-800 dark:bg-blue-800-dark dark:text-blue-900 flex h-auto w-full grow flex-col items-center justify-center gap-2 rounded p-8 text-white lg:px-12">
                <span className="text-center text-xl uppercase tracking-wide opacity-50 min-[1920px]:text-2xl">
                  Getting Started
                </span>
                <span className="mb-2 text-center text-xl min-[1920px]:text-2xl">
                  Your bot needs a separate Metaculus account. Make sure to log
                  out of your main account and come back to this page.
                </span>
                <Button
                  variant="secondary"
                  type="submit"
                  size="lg"
                  className="border-none"
                  onClick={() => (window.location.href = "/accounts/signout")}
                >
                  Log Out
                </Button>
              </div>
            )}
            {isUserAuthenticated && isUserBot && (
              <div className="bg-blue-800 dark:bg-blue-800-dark dark:text-blue-900 flex h-auto w-full grow flex-col items-center justify-center gap-2 rounded p-8 text-white lg:px-12 min-[1920px]:gap-6">
                <span className="mb-4 text-center text-2xl min-[1920px]:text-3xl">
                  Your bot is successfully registered for the tournament.
                </span>

                <div className="flex flex-col gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setTokenModalOpen(true)}
                    type="submit"
                    size="md"
                    className="border-none min-[1920px]:scale-150"
                  >
                    Show My Token
                  </Button>
                  {isUserAuthenticated && isUserBot && (
                    <a href="/aib/demo">
                      <Button
                        variant="secondary"
                        type="submit"
                        size="md"
                        className="border-none"
                      >
                        Forecasting Demo
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}
            <div className="flex flex-row gap-3">
              <a
                href="/project/aibq3/"
                className="hover:bg-blue-500/40 dark:bg-blue-100-dark dark:hover:bg-blue-600/40 flex h-fit w-full flex-col items-start justify-center gap-4 rounded bg-white p-4 text-center no-underline transition-all md:p-5 lg:justify-between min-[1920px]:gap-6 min-[1920px]:p-8"
              >
                <FontAwesomeIcon
                  icon={"file"}
                  className="text-blue-700 dark:text-blue-700-dark self-center text-3xl md:text-2xl lg:self-start min-[1920px]:text-5xl"
                />
                <span className="block self-center text-center text-base no-underline md:text-xl lg:self-start lg:text-left min-[1920px]:text-3xl">
                  Tournament Page
                </span>
              </a>
              <a
                href="https://www.metaculus.com/notebooks/25525/-announcing-the-ai-forecasting-benchmark-series--july-8-120k-in-prizes/"
                className="hover:bg-blue-500/40 dark:bg-blue-100-dark dark:hover:bg-blue-600/40 flex h-fit w-full flex-col items-start justify-center gap-4 rounded bg-white p-4 text-center no-underline transition-all md:p-5 lg:h-full lg:justify-between min-[1920px]:gap-6 min-[1920px]:p-8"
              >
                <FontAwesomeIcon
                  icon={"circle-question"}
                  className="text-blue-700 dark:text-blue-700-dark self-center text-3xl md:text-2xl lg:self-start min-[1920px]:text-5xl"
                />
                <span className="block self-center text-center text-base no-underline md:text-xl lg:self-start lg:text-left min-[1920px]:text-3xl">
                  How it works
                </span>
              </a>
            </div>
          </div>
        </div>
        <BaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <BotRegistration />
        </BaseModal>
        <BaseModal
          isOpen={tokenmodalOpen}
          onClose={() => setTokenModalOpen(false)}
        >
          <div className="flex w-full flex-col items-center gap-3 p-4">
            <span className="text-center text-lg">
              Your token is needed for your bot to interact with the Metaculus
              API.
            </span>
            <div className="border-blue-500 bg-blue-400 dark:border-blue-500-dark dark:bg-blue-400-dark flex flex-row gap-2 rounded border p-2 text-base">
              <span>{"window.metacData.metaculus_token"}</span>
            </div>
          </div>
        </BaseModal>
      </div>
    </>
  );
}
