import Link from "next/link";
import { FC } from "react";

import MobileMenu from "@/app/(main)/components/mobile_menu";
import NavUserButton from "@/components/auth";
import NavLink from "@/components/nav_link";
import ThemeToggle from "@/components/theme_toggle";

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
