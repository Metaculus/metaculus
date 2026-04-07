"use client";

import {
  faArrowRight,
  faBars,
  faMagnifyingGlass,
  faMinus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

import MetaculusStorefrontLogo from "./metaculus_storefront_logo";
import { LogOut } from "../../(main)/accounts/actions";

type NavLink = {
  href: string;
  labelKey: string;
};

const PRIMARY_LINKS: NavLink[] = [
  { href: "/questions/", labelKey: "questions" },
  { href: "/tournaments", labelKey: "tournaments" },
  { href: "/services", labelKey: "services" },
  { href: "/news/", labelKey: "news" },
];

const SECONDARY_LINKS: NavLink[] = [
  { href: "/leaderboard", labelKey: "leaderboards" },
  { href: "/about/", labelKey: "aboutMetaculus" },
  { href: "/press/", labelKey: "forJournalists" },
  { href: "/faq/", labelKey: "faq" },
  { href: "/questions/track-record/", labelKey: "trackRecord" },
  { href: "/aggregation-explorer", labelKey: "aggregationExplorer" },
];

const MenuLink: FC<{
  href: string;
  label: string;
  onClick: () => void;
}> = ({ href, label, onClick }) => (
  <Link
    href={href}
    className="text-right text-sm font-semibold leading-[1.3] text-blue-900 no-underline transition-colors hover:text-blue-600"
    onClick={onClick}
  >
    {label}
  </Link>
);

const Divider: FC = () => (
  <hr className="m-0 w-full border-t border-blue-300" />
);

const StorefrontNavbar: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const logoHref = user ? "/questions/" : "/";

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const closeAll = useCallback(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
    setIsSearchOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
    setIsMenuOpen(false);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAll]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    router.push(`/questions/?search=${encodeURIComponent(trimmed)}`);
    closeAll();
    setSearchQuery("");
  };

  const handleLoginRedirect = useCallback(() => {
    router.push("/questions/");
  }, [router]);

  const searchInput = (
    <form
      onSubmit={handleSearchSubmit}
      className="flex items-center justify-between rounded-2xl bg-[#eff4f4] px-4 py-2 shadow-2xl"
    >
      <div className="flex items-center gap-2.5">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-base text-blue-800 opacity-50"
        />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("questionSearchPlaceholder")}
          className="w-full bg-transparent text-base font-medium text-blue-800 placeholder:opacity-50 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-700 transition-opacity",
          searchQuery.trim() ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <FontAwesomeIcon icon={faArrowRight} className="text-base text-white" />
      </button>
    </form>
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Main navbar row */}
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href={logoHref} className="inline-flex items-center no-underline">
          <MetaculusStorefrontLogo className="h-[38px] w-auto text-white md:h-[50px]" />
          <div className="ml-3.5 flex flex-col gap-0.5">
            <span className="text-lg font-bold leading-tight tracking-[-0.36px] text-white md:text-xl">
              Metaculus
            </span>
            <span className="text-xs font-medium text-[#adbfd4] opacity-75 md:text-sm">
              {t("clarityInAComplexWorld")}
            </span>
          </div>
        </Link>

        {/* Right side: search + hamburger */}
        <div className="flex items-center">
          {/* Search toggle */}
          <button
            type="button"
            onClick={toggleSearch}
            className="flex size-10 items-center justify-center text-xl text-white/70 transition-colors hover:text-white"
            aria-label={t("search")}
          >
            <FontAwesomeIcon
              icon={isSearchOpen ? faXmark : faMagnifyingGlass}
            />
          </button>

          {/* Hamburger toggle */}
          <button
            type="button"
            onClick={toggleMenu}
            className="flex size-10 items-center justify-center text-xl text-white/70 transition-colors hover:text-white"
            aria-label="Menu"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faMinus : faBars} />
          </button>
        </div>
      </div>

      {/* Search dropdown (floats below buttons, no layout shift) */}
      {isSearchOpen && (
        <div className="absolute right-0 top-full z-[200] mt-2 w-full md:w-[375px]">
          {searchInput}
        </div>
      )}

      {/* Hamburger dropdown */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full z-[200] mt-2 w-48 rounded-2xl bg-[#eff4f4] p-4 shadow-2xl">
          <div className="flex flex-col gap-3">
            {!user && (
              <>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentModal({
                        type: "signup",
                        data: { onSuccess: handleLoginRedirect },
                      });
                      closeAll();
                    }}
                    className="flex-1 rounded-full bg-blue-700 px-2 py-1 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                  >
                    {t("createAnAccount")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentModal({
                        type: "signin",
                        data: { onSuccess: handleLoginRedirect },
                      });
                      closeAll();
                    }}
                    className="flex-1 rounded-full border border-blue-400 px-2 py-1 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-300/50"
                  >
                    {t("logIn")}
                  </button>
                </div>
                <Divider />
                {[...PRIMARY_LINKS, ...SECONDARY_LINKS.slice(0, 3)].map(
                  (link) => (
                    <MenuLink
                      key={link.href}
                      href={link.href}
                      label={t(link.labelKey as Parameters<typeof t>[0])}
                      onClick={closeAll}
                    />
                  )
                )}
              </>
            )}

            {user && (
              <>
                {PRIMARY_LINKS.map((link) => (
                  <MenuLink
                    key={link.href}
                    href={link.href}
                    label={t(link.labelKey as Parameters<typeof t>[0])}
                    onClick={closeAll}
                  />
                ))}
                <Divider />
                {SECONDARY_LINKS.map((link) => (
                  <MenuLink
                    key={link.href}
                    href={link.href}
                    label={t(link.labelKey as Parameters<typeof t>[0])}
                    onClick={closeAll}
                  />
                ))}
                <Divider />
                <p className="text-right text-sm leading-[1.3] text-blue-900">
                  <span className="font-normal">{t("loggedInAs")}</span>{" "}
                  <span className="font-semibold text-blue-700">
                    {user.username}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => void LogOut()}
                  className="text-right text-sm font-normal text-[#753e3e] transition-colors hover:text-[#753e3e]/50"
                >
                  {t("logOut")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StorefrontNavbar;
