"use client";

import Link from "next/link";
import { FC } from "react";

import NavUserButton from "@/components/auth";
import ThemeToggle from "@/components/theme_toggle";
import { useAuth } from "@/contexts/auth_context";
import cn from "@/utils/core/cn";

const Header: FC = () => {
  const { user } = useAuth();
  return (
    <header className="fixed left-0 top-0 z-50 flex h-12 w-full flex-auto flex-wrap items-center justify-between bg-blue-900 text-gray-0">
      <div className="flex h-full items-center">
        <Link
          href="/"
          className={cn(
            "inline-flex h-full max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline lg:bg-blue-800 lg:dark:bg-gray-0-dark"
          )}
        >
          <h1 className="mx-3 my-0 font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 antialiased">
            <span className="inline">M</span>
          </h1>
        </Link>
      </div>

      <div className="z-10 flex h-full items-center justify-center gap-2 pr-4">
        {user && <NavUserButton btnClassName="text-[13px] h-full" />}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
