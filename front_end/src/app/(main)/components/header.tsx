import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { FC } from "react";

import NavUserButton, { DropdownIcon } from "@/components/auth";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";

import MobileMenu from "./mobile_menu";

const LINKS = [
  {
    label: "Questions",
    href: "/questions",
  },
  {
    label: "Tournaments",
    href: "/tournaments",
  },
];

const LinkMenuItem: FC<{ href: string; label: string }> = ({ href, label }) => {
  return (
    <MenuItem>
      <Link
        className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
        href={href}
      >
        {label}
      </Link>
    </MenuItem>
  );
};

const NavMoreButton: FC = () => {
  return (
    <Menu>
      <MenuButton className="flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-200-dark">
        More
        <DropdownIcon />
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 text-white lg:border lg:border-blue-200-dark lg:bg-blue-900 lg:text-sm"
      >
        <LinkMenuItem href="/about/" label="About Metaculus" />
        <LinkMenuItem href="/press/" label="For Journalists" />
        <LinkMenuItem href="/faq/" label="FAQ" />
        <LinkMenuItem href="/questions/track-record/" label="Track Record" />
        <LinkMenuItem href="/project/journal/" label="About Metaculus" />
      </MenuItems>
    </Menu>
  );
};

const Header: FC = () => {
  return (
    <header className="fixed left-0 top-0 z-50 flex w-full flex-wrap items-stretch justify-between border-b border-blue-200-dark bg-blue-900 text-white">
      <div className="ml-0.5 flex min-h-12 flex-auto">
        <Link
          href="/"
          className="inline-flex max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline"
        >
          <h1 className="mx-3 my-0 pt-1 font-alternate-gothic text-[30px] font-light tracking-[.08em] !text-white antialiased">
            M<span className="hidden xs:inline">etaculus</span>
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
              href={`/leaderboard/`}
              className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
              activeClassName="bg-blue-300-dark"
            >
              Leaderboards
            </NavLink>
          </li>
          <li>
            <NavLink
              href={`/news/`}
              className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
              activeClassName="bg-blue-300-dark"
            >
              News
            </NavLink>
          </li>
          <li>
            <NavMoreButton />
          </li>
          <li>
            {" "}
            <NavLink
              href={`/questions/create/`}
              className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark"
              activeClassName="bg-blue-300-dark"
            >
              + Write
            </NavLink>
          </li>
          <li className="z-10 flex h-full items-center justify-center">
            <NavUserButton />
          </li>
          <li className="z-10 flex items-center p-4">
            <ThemeToggle />
          </li>
        </ul>
        <MobileMenu />
      </div>
    </header>
  );
};

export default Header;
