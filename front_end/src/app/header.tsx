import Link from "next/link";
import { FC } from "react";

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
    <header className="ng-scope text-white fixed left-0 top-0 z-50 flex w-full flex-wrap items-stretch justify-between border-b border-blue-200-dark bg-blue-900">
      <div className="ml-0.5 flex min-h-12 flex-auto">
        <Link
          href="/"
          className="inline-flex max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline"
        >
          <h1 className="text-white mx-3 my-0 pt-1 font-['alternate-gothic-no-1-d'] text-[30px] font-light tracking-[.08em] antialiased">
            M<span className="hidden xs:inline">etaculus</span>
          </h1>
        </Link>

        <ul className="relative flex flex-auto list-none items-stretch justify-end p-0 text-base font-medium lg:text-sm">
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
          <li className="z-10 lg:flex lg:items-center">
            <NavUserButton />
          </li>
          <li className="mt-2 flex items-center justify-between bg-blue-900 px-4 py-3 lg:m-0 lg:p-3">
            <span className="mx-1 flex items-center">
              <ThemeToggle />
            </span>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
