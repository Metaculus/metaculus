"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";
import { useCommunity } from "@/contexts/community_provider";

import CommunitiesDropdown from "../communities_dropdown";
import MobileMenu from "../mobile_menu";

const CommunityHeader: FC = () => {
  const t = useTranslations();
  const { currentCommunity, setCurrentCommunity } = useCommunity();

  useEffect(() => {
    setCurrentCommunity({ name: "Test community", slug: "test-community" });
  }, [setCurrentCommunity]);

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
        <span className="text-lg text-gray-700">/</span>
        {currentCommunity && (
          <Link
            href={`/community/${currentCommunity.slug}`}
            className="ml-2 mr-1 max-w-[230px] truncate no-underline hover:underline hover:underline-offset-4"
          >
            {currentCommunity.name}
          </Link>
        )}
        <CommunitiesDropdown />
      </div>

      {/*Desktop items*/}
      <ul className="relative hidden list-none items-center justify-end text-sm font-medium lg:flex">
        <li>
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
            className="mr-2 flex h-full items-center rounded-full bg-blue-300-dark p-3 py-2 capitalize no-underline hover:bg-blue-200-dark"
            activeClassName="bg-blue-300-dark"
          >
            <FontAwesomeIcon size="xs" className="mr-1" icon={faPlus} />
            {t("create")}
          </NavLink>
        </li>
        <li className="z-10 flex h-full items-center justify-center">
          <NavUserButton />
        </li>
        <li className="z-10 flex items-center p-2 hover:bg-blue-200-dark">
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
