"use client";

import { faCircleQuestion, faFile } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState, FC } from "react";

import { SignupForm } from "@/components/auth/signup";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";

import { Dates, Prize } from "./cards-q3";
import Description from "./description-q3";
import Hero from "./hero";
import HeroQ3 from "./hero-q3";

const AiBenchmarkingTournamentPage: FC<{ token: string | null }> = ({
  token,
}) => {
  const { user } = useAuth();
  const isUserAuthenticated = !!user;
  const isUserBot = isUserAuthenticated && user.is_bot;
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenmodalOpen, setTokenModalOpen] = useState(false);
  const t = useTranslations();

  return (
    <div className="mx-auto h-auto w-full flex-auto items-stretch bg-gradient-to-tl from-blue-300/30 via-blue-100/30 to-blue-400/30 px-4 py-4 text-blue-700 dark:bg-blue-800 dark:from-blue-600/50 dark:via-blue-800/30 dark:to-blue-500/30 dark:text-blue-700-dark">
      <div className="flex size-full flex-col items-center gap-3">
        <div className="flex w-full flex-col gap-3 md:flex-row">
          <div className="flex w-full flex-col gap-3 md:w-1/3">
            <HeroQ3 />
          </div>
          <div className="flex h-auto w-full flex-row gap-3 md:w-1/3 md:flex-col">
            <Prize />
            <Dates />
          </div>
          <div className="relative flex h-auto min-h-[8rem] w-full flex-row overflow-hidden rounded md:w-1/3 lg:h-auto">
            <Image
              src="https://metaculus-media.s3.amazonaws.com/hires.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className="size-full object-cover object-center"
              quality={100}
            />
          </div>
        </div>
        <div className="flex size-full flex-col gap-3 md:flex-row">
          <div className="w-full">Leaderboard</div>
          <div className="w-full">Q4 Ready - Link</div>
        </div>
        <BaseModal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="flex max-h-full max-w-xl flex-col items-center">
            <h1 className="mx-auto mt-2 text-center text-blue-800 dark:text-blue-800-dark">
              {t("FABCreateBotAccount")}
            </h1>
            <p className="mx-auto text-center leading-normal opacity-75">
              {t("FABBotAlreadyCreated")}
            </p>
            <div className="sm:w-80 sm:pr-4">
              {/*
                The project ID to add the user to is hardcoded here - the FAB project is changed once every quarter, and it doesn't
                make sense to build infrastructure to manage the ID from the UI. When the new FAB tournament starts, we'll just change the ID here.
              */}
              <SignupForm forceIsBot={false} addToProject={3349} />
            </div>
            <div className="mt-6 text-balance px-4 text-center leading-normal text-gray-700 text-gray-700 opacity-75 dark:text-gray-700-dark dark:text-gray-700-dark">
              {t.rich("registrationTerms", {
                terms: (chunks) => (
                  <Link target="_blank" href={"/terms-of-use/"}>
                    {chunks}
                  </Link>
                ),
                privacy: (chunks) => (
                  <Link target="_blank" href={"/privacy-policy/"}>
                    {chunks}
                  </Link>
                ),
              })}
            </div>
          </div>
        </BaseModal>
        <BaseModal
          isOpen={tokenmodalOpen}
          onClose={() => setTokenModalOpen(false)}
        >
          <div className="flex w-full flex-col items-center gap-3 p-4">
            <span className="text-center text-lg">{t("FABTokenInfo")}</span>
            <div className="flex flex-row gap-2 rounded border border-blue-500 bg-blue-400 p-2 text-base dark:border-blue-500-dark dark:bg-blue-400-dark">
              <span>{token}</span>
            </div>
          </div>
        </BaseModal>
      </div>
    </div>
  );
};

export default AiBenchmarkingTournamentPage;
