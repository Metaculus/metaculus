"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";
import { Community } from "@/types/projects";

import { useShowActiveCommunityContext } from "../../community/components/community_context";
import CommunitiesDropdown from "../communities_dropdown";
import MobileMenu from "../mobile_menu";

type Props = {
  community: Community | null;
  alwaysShowName?: boolean;
};

const CommunityHeader: FC<Props> = ({ community, alwaysShowName = true }) => {
  const t = useTranslations();
  const { showActiveCommunity } = useShowActiveCommunityContext();
  const [localShowName, setLocalShowName] = useState(alwaysShowName);

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
        <span className="text-2xl font-extralight text-gray-600">/</span>
        {community && (showActiveCommunity || localShowName) && (
          <Link
            href={`/community/${community.slug}`}
            className="ml-3 mr-1 max-w-[230px] truncate no-underline hover:underline hover:decoration-gray-600 hover:underline-offset-4"
          >
            {community.name}
          </Link>
        )}
        <CommunitiesDropdown community={community} />
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
            href={`/questions/create/?community_id=${community?.id}`}
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
      <MobileMenu
        community={community}
        onClick={alwaysShowName ? undefined : setLocalShowName}
      />
    </header>
  );
};

export default CommunityHeader;
