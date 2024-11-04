"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import { Community } from "@/types/projects";;

type Props = {
  community: Community;
  mode: string;
};

const CommunityManagement: FC<Props> = ({ community, mode }) => {
  const t = useTranslations();
  const router = useRouter();

  return (
    <div className="relative">
      <div className="flex items-center">
        <Button
          variant="text"
          className="mr-3 !p-0"
          onClick={() => router.push(`/community/${community.slug}`)}
        >
          <FontAwesomeIcon
            className="text-blue-700/40 dark:text-blue-700-dark/40"
            icon={faArrowLeft}
            width={20}
            size="xl"
          />
        </Button>

        <h1 className="m-0 max-w-[250px] truncate text-xl font-medium text-blue-900 dark:text-blue-900-dark xs:max-w-full xs:text-2xl">
          {t("communityManagement")}
        </h1>
      </div>

      <div className="mt-6 flex flex-row text-xs font-medium md:text-sm">
        <Link href={`/community/${community.slug}/settings?mode=questions`}>
          <button
            dir="ltr"
            className={
              "m-0 h-full rounded-s-3xl border border-e-0 border-blue-500 px-3 py-2 text-sm font-medium leading-[14px] text-blue-700 dark:border-blue-500-dark dark:text-blue-700-dark max-[340px]:px-2 " +
              (mode === "questions"
                ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                : " bg-gray-0 hover:bg-blue-200 dark:bg-gray-0-dark hover:dark:bg-blue-800 ")
            }
          >
            {t("questions")}
          </button>
        </Link>
        <Link href={`/community/${community.slug}/settings?mode=settings`}>
          <button
            dir="rtl"
            className={
              "m-0 h-full rounded-s-3xl border border-e-0 border-blue-500 px-3 py-2 text-sm font-medium leading-[14px] text-blue-700 dark:border-blue-500-dark dark:text-blue-700-dark max-[340px]:px-2 " +
              (mode === "settings"
                ? " bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-100 dark:text-blue-900 dark:hover:bg-blue-200 "
                : " bg-gray-0 hover:bg-blue-200 dark:bg-gray-0-dark hover:dark:bg-blue-800")
            }
          >
            {t("settings")}
          </button>
        </Link>
      </div>

      <hr className="text -mx-3 border-blue-500 dark:border-blue-600/50 xs:-mx-8" />
    </div>
  );
};

export default CommunityManagement;
