"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";
import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";
import { isPathEqual } from "@/utils/navigation";

import ContentTranslatedBanner from "../content_translated_banner";
import GlobalSearch from "../global_search";
import MobileMenu from "./components/mobile_menu";
import NavbarLinks from "./components/navbar_links";
import NavbarLogo from "./components/navbar_logo";
import useNavbarLinks from "./hooks/useNavbarLinks";

const Header: FC = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const pathname = usePathname();
  const { navbarLinks, menuLinks, LINKS } = useNavbarLinks();
  const { lgLinks, smLinks, xsLinks, xxsLinks } = navbarLinks;

  return (
    <>
      <header className="fixed left-0 top-0 z-[200] flex h-header w-full flex-auto items-stretch justify-between bg-blue-900 text-gray-0">
        <div className="flex items-stretch justify-between">
          <NavbarLogo className="mr-1 lg:mr-5" />

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

          {/* The More menu */}
          <div className="h-full justify-start text-sm font-medium">
            <Menu>
              <MenuButton
                className={cn(
                  "group relative flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-700",
                  {
                    active: menuLinks.some((link) =>
                      isPathEqual(pathname, link.href ?? "")
                    ),
                  }
                )}
              >
                {t("more")}
                <FontAwesomeIcon size="xs" icon={faChevronDown} />
                <span className="absolute bottom-0 left-0 h-1 w-full bg-blue-600 opacity-0 transition-opacity group-[.active]:opacity-100" />
              </MenuButton>
              <MenuItems
                anchor="bottom"
                className="z-100 border border-blue-200-dark bg-blue-900 text-sm text-gray-0"
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
          </div>
        </div>

        {/* Global Search */}
        <GlobalSearch className="ml-auto" />

        <ul className="relative hidden list-none items-center justify-end text-sm font-medium md:flex">
          {!!user && (
            <li className="hidden h-full lg:block">
              <NavLink
                href={LINKS.createQuestion.href}
                className="group relative flex h-full items-center p-3 no-underline hover:bg-blue-700"
              >
                {LINKS.createQuestion.label}
              </NavLink>
            </li>
          )}
          <li className="z-10 flex h-full items-center justify-center">
            <NavUserButton />
          </li>
          <li className="z-10 flex h-full items-center p-2 hover:bg-blue-700">
            <LanguageMenu />
          </li>
          <li className="z-10 flex items-center p-4">
            <ThemeToggle />
          </li>
        </ul>

        {!user && (
          <div className="text-sm md:hidden">
            <NavUserButton />
          </div>
        )}

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
      className="flex items-end justify-end whitespace-nowrap px-6 py-1.5 text-right no-underline hover:bg-blue-700"
      href={href}
    >
      {label}
    </MenuItem>
  );
};

export default Header;
