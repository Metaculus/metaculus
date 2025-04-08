"use client";

import Link from "next/link";
import { FC, useState } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";
import { Community } from "@/types/projects";

import { useShowActiveCommunityContext } from "../../c/components/community_context";
import CommunitiesDropdown from "../communities_dropdown";
import CommunityMobileMenu from "./components/community_mobile_menu";
import useNavbarLinks from "./hooks/useNavbarLinks";
type Props = {
  community: Community | null;
  alwaysShowName?: boolean;
};

const CommunityHeader: FC<Props> = ({ community, alwaysShowName = true }) => {
  const { showActiveCommunity } = useShowActiveCommunityContext();
  const [localShowName, setLocalShowName] = useState(alwaysShowName);
  const { navbarLinks } = useNavbarLinks({ community });

  return (
    <header className="fixed left-0 top-0 z-100 flex min-h-12 w-full flex-auto flex-wrap items-stretch justify-between bg-blue-900 text-gray-0">
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
            href={`/c/${community.slug}`}
            className="ml-3 mr-1 max-w-[230px] truncate no-underline hover:underline hover:decoration-gray-600 hover:underline-offset-4"
          >
            {community.name}
          </Link>
        )}
        <CommunitiesDropdown community={community} />
      </div>

      {/*Desktop items*/}
      <ul className="relative hidden list-none items-center justify-end text-sm font-medium lg:flex">
        {navbarLinks.communityLinks.map((link) => (
          <li key={link.href} className="h-full">
            <NavLink href={link.href} className={link.className}>
              {link.label}
            </NavLink>
          </li>
        ))}
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
      <CommunityMobileMenu
        community={community}
        onClick={alwaysShowName ? undefined : setLocalShowName}
      />
    </header>
  );
};

export default CommunityHeader;
