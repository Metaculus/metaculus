"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";
import { CurrentCommunity } from "@/types/community";

import CommunitiesDropdown from "../communities_dropdown";
import MobileMenu from "../mobile_menu";

type Props = {
  currentCommunity: CurrentCommunity | null;
};

const CommunityHeader: FC<Props> = ({ currentCommunity }) => {
  const t = useTranslations();

  return (
    <header className="fixed left-0 top-0 z-50 flex min-h-12 w-full flex-auto flex-wrap items-stretch justify-between border-b border-blue-200-dark bg-blue-900 text-gray-0">
      <div className="flex items-center">
        <Link
          href="/questions"
          className="inline-flex max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline"
        >
          <h1 className="mx-3 my-0 font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 antialiased">
            M
          </h1>
        </Link>
        <span className="text-xl font-light text-gray-600">/</span>
        {currentCommunity && (
          <Link
            href={`/community/${currentCommunity.slug}`}
            className="ml-3 mr-1 max-w-[230px] truncate no-underline hover:underline hover:decoration-gray-600 hover:underline-offset-4"
          >
            {currentCommunity.name}
          </Link>
        )}
        <CommunitiesDropdown currentCommunity={currentCommunity} />
      </div>

      {/*Desktop items*/}
      <ul className="relative hidden list-none items-center justify-end text-sm font-medium lg:flex">
        <li className="h-full">
          <NavLink
            href={`/questions/`}
            className="mr-2 flex h-full items-center p-3 capitalize no-underline hover:bg-blue-200-dark"
            activeClassName="bg-blue-300-dark"
          >
            {t("questions")}
          </NavLink>
        </li>
        <li>
          <NavLink
            href={`/questions/create/?community=${currentCommunity?.slug}`}
            className="mr-2 flex h-full items-center rounded-full bg-blue-300-dark p-3 py-1 capitalize no-underline hover:bg-blue-200-dark"
            activeClassName="bg-blue-300-dark"
          >
            <FontAwesomeIcon width={14} className="mr-1" icon={faPlus} />
            {t("create")}
          </NavLink>
        </li>
        <li className="z-10 flex h-full items-center justify-center">
          <NavUserButton />
        </li>
        <li className="z-10 flex h-full items-center p-2 hover:bg-blue-200-dark">
          <LanguageMenu />
        </li>
        <li className="z-10 flex items-center p-4">
          <ThemeToggle />
        </li>
      </ul>
      <MobileMenu currentCommunity={currentCommunity} />
    </header>
  );
};

export default CommunityHeader;
