import { faPlus, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import NavUserButton from "@/components/auth";
import LanguageMenu from "@/components/language_menu";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";

import MobileMenu from "./mobile_menu";

const LinkMenuItem: FC<{ href: string; label: string }> = ({ href, label }) => {
  return (
    <MenuItem
      as={Link}
      className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
      href={href}
    >
      {label}
    </MenuItem>
  );
};

const Header: FC = () => {
  const t = useTranslations();

  const LINKS = [
    {
      label: "Threshold 2030",
      href: "/conference",
    },
    {
      label: t("questions"),
      href: "/questions",
    },
    // {
    //   label: t("tournaments"),
    //   href: "/tournaments",
    // },
  ];

  return (
    <header className="fixed left-0 top-0 z-50 flex min-h-12 w-full flex-auto flex-wrap items-stretch justify-between border-b border-blue-200-dark bg-blue-900 text-gray-0">
      <Link
        href="/"
        className="inline-flex max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline"
      >
        <h1 className="mx-3 my-0 font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 antialiased">
          <span className="hidden capitalize xs:inline">{t("metaculus")}</span>
          <span className="inline xs:hidden">M</span>
        </h1>
      </Link>

      {/*Common items for desktop and mobile*/}
      <ul className="flex flex-auto list-none items-stretch justify-end p-0 text-sm font-medium">
        {LINKS.map((link) => (
          <li key={link.href} className="z-10">
            <NavLink
              href={link.href}
              className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
              activeClassName="bg-blue-300-dark"
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
      {/*Desktop items*/}
      <ul className="relative hidden list-none items-center justify-end text-sm font-medium lg:flex">
        <li>
          <NavLink
            href={`/tournaments`}
            className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
            activeClassName="bg-blue-300-dark"
          >
            {t("tournaments")}
          </NavLink>
        </li>
        <li>
          <NavLink
            href={`/leaderboard`}
            className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
            activeClassName="bg-blue-300-dark"
          >
            {t("leaderboards")}
          </NavLink>
        </li>
        <li>
          <NavLink
            href={`/news/`}
            className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
            activeClassName="bg-blue-300-dark"
          >
            {t("news")}
          </NavLink>
        </li>
        <li>
          <Menu>
            <MenuButton className="flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-200-dark">
              {t("more")}
              <FontAwesomeIcon size="xs" icon={faChevronDown} />
            </MenuButton>
            <MenuItems
              anchor="bottom"
              className="z-50 text-gray-0 lg:border lg:border-blue-200-dark lg:bg-blue-900 lg:text-sm"
            >
              <LinkMenuItem href="/about/" label={t("aboutMetaculus")} />
              <LinkMenuItem href="/press/" label={t("forJournalists")} />
              <LinkMenuItem href="/faq/" label={t("faq")} />
              <LinkMenuItem
                href="/questions/track-record/"
                label={t("trackRecord")}
              />
              <LinkMenuItem href="/project/journal/" label={t("theJournal")} />
              <LinkMenuItem
                href="/aggregation-explorer"
                label={t("aggregationExplorer")}
              />
            </MenuItems>
          </Menu>
        </li>
        <li>
          <NavLink
            href={`/questions/create/`}
            className="mr-2 flex h-full items-center p-3 capitalize no-underline hover:bg-blue-200-dark"
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
      <MobileMenu />
    </header>
  );
};

export default Header;
