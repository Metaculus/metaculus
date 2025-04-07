"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";
import { useAuth } from "@/contexts/auth_context";

import ContentTranslatedBanner from "../content_translated_banner";
import GlobalSearch from "../global_search";
import MobileMenu from "./components/mobile_menu";
import NavbarLinks from "./components/navbar_links";
import NavbarLogo from "./components/navbar_logo";
import useNavbarLinks from "./hooks/useNavbarLinks";

const Header: FC = () => {
  const t = useTranslations();
  const { user } = useAuth();

  const { navbarLinks, menuLinks, LINKS } = useNavbarLinks();
  const { lgLinks, smLinks, xsLinks, xxsLinks } = navbarLinks;

  return (
    <>
      <header className="fixed left-0 top-0 z-100 flex h-header w-full flex-auto items-stretch justify-between border-b border-blue-200-dark bg-blue-900 text-gray-0">
        <NavbarLogo />

        {/* Global Search */}
        <GlobalSearch />

        {/* Regular links */}
        <NavbarLinks links={lgLinks} className="hidden lg:flex" />
        <NavbarLinks
          links={smLinks}
          className="hidden justify-start min-[512px]:max-lg:flex md:justify-end"
        />
        <NavbarLinks
          links={xsLinks}
          className="hidden justify-start min-[375px]:max-[511px]:flex"
        />
        <NavbarLinks
          links={xxsLinks}
          className="hidden justify-start max-[374px]:flex"
        />

        <ul className="relative hidden list-none items-center justify-end text-sm font-medium md:flex">
          <li className="h-full">
            <Menu>
              <MenuButton className="flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-200-dark">
                {t("more")}
                <FontAwesomeIcon size="xs" icon={faChevronDown} />
              </MenuButton>
              <MenuItems
                anchor="bottom"
                className="z-50 border border-blue-200-dark bg-blue-900 text-sm text-gray-0"
              >
                {menuLinks.map((link) => (
                  <LinkMenuItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </MenuItems>
            </Menu>
          </li>
          {!!user && (
            <li className="hidden h-full lg:block">
              <NavLink
                href={LINKS.createQuestion.href}
                className="mr-2 flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
                activeClassName="bg-blue-300-dark"
              >
                {LINKS.createQuestion.label}
              </NavLink>
            </li>
          )}
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
        <MobileMenu />
      </header>
      <ContentTranslatedBanner />
    </>
  );
};

const LinkMenuItem: FC<{ href: string; label: ReactNode }> = ({
  href,
  label,
}) => {
  return (
    <MenuItem
      as={Link}
      className="flex items-end justify-end whitespace-nowrap px-6 py-1.5 text-right no-underline hover:bg-blue-200-dark"
      href={href}
    >
      {label}
    </MenuItem>
  );
};

export default Header;
