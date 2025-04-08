"use client";
import {
  faBars,
  faMagnifyingGlass,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef, useState } from "react";

import { LogOut } from "@/app/(main)/accounts/actions";
import LanguageMenu from "@/components/language_menu";
import ThemeToggle from "@/components/theme_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import cn from "@/utils/cn";

import MobileMenuLink from "./mobile_menu_link";
import MobileMenuTitle from "./mobile_menu_title";
import GlobalSearch from "../../global_search";
import useNavbarLinks from "../hooks/useNavbarLinks";

export const MobileMenu: FC = () => {
  const { user } = useAuth();
  const { LINKS } = useNavbarLinks();
  const { PUBLIC_ALLOW_SIGNUP, PUBLIC_ALLOW_TUTORIAL } = usePublicSettings();
  const { setCurrentModal } = useModal();
  const t = useTranslations();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        !toggleButtonRef.current?.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const handleSearchSubmit = () => {
    setIsSearchOpen(false);
  };

  return (
    <>
      <div className="flex items-center md:hidden">
        <button
          ref={toggleButtonRef}
          onClick={toggleSearch}
          className={`text-md block size-12 text-white hover:bg-blue-200-dark active:bg-blue-300-dark ${isSearchOpen ? "bg-blue-700 hover:bg-blue-600" : "bg-transparent"}`}
          aria-label="Toggle search"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </button>
        <Menu>
          <MenuButton className="color-white flex size-12 flex-col items-center justify-center hover:bg-blue-200-dark active:bg-blue-300-dark lg:hidden lg:items-end lg:justify-end">
            {({ open }) =>
              open ? (
                <FontAwesomeIcon icon={faMinus} size="lg" />
              ) : (
                <FontAwesomeIcon icon={faBars} size="lg" />
              )
            }
          </MenuButton>
          <Transition
            enter="duration-200 ease-out"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="duration-300 ease-out"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <MenuItems className="absolute inset-x-0 top-12 max-h-[calc(100dvh-48px)] list-none flex-col items-stretch justify-end space-y-0.5 overflow-y-auto bg-blue-200-dark text-base no-underline lg:hidden">
              <MobileMenuLink
                href={LINKS.tournaments.href}
                className={cn("hidden", {
                  "max-[374px]:flex": !isNil(user),
                  "max-[512px]:flex": isNil(user),
                })}
              >
                {LINKS.tournaments.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.leaderboards.href}>
                {LINKS.leaderboards.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.news.href}>
                {LINKS.news.label}
              </MobileMenuLink>
              <MobileMenuTitle>{t("more")}</MobileMenuTitle>
              <MobileMenuLink href={LINKS.about.href}>
                {LINKS.about.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.press.href}>
                {LINKS.press.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.faq.href}>
                {LINKS.faq.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.trackRecord.href}>
                {LINKS.trackRecord.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.journal.href}>
                {LINKS.journal.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.aggregationExplorer.href}>
                {LINKS.aggregationExplorer.label}
              </MobileMenuLink>
              <MobileMenuLink href={LINKS.createQuestion.href}>
                {LINKS.createQuestion.label}
              </MobileMenuLink>
              {user ? (
                <>
                  <MobileMenuTitle>{t("account")}</MobileMenuTitle>
                  <MobileMenuLink href={`/accounts/profile/${user.id}`}>
                    {t("profile")}
                  </MobileMenuLink>
                  <MobileMenuLink href={"/accounts/settings/"}>
                    {t("settings")}
                  </MobileMenuLink>
                  {PUBLIC_ALLOW_TUTORIAL && (
                    <MobileMenuLink
                      onClick={() => setCurrentModal({ type: "onboarding" })}
                    >
                      {t("tutorial")}
                    </MobileMenuLink>
                  )}
                  {user.is_superuser && (
                    <>
                      {!PUBLIC_ALLOW_SIGNUP && (
                        <MobileMenuLink href={"/accounts/invite/"}>
                          {t("signupInviteUsers")}
                        </MobileMenuLink>
                      )}
                      <MobileMenuLink href={"/admin"}>
                        {t("admin")}
                      </MobileMenuLink>
                    </>
                  )}
                  <MobileMenuLink
                    onClick={() => {
                      void LogOut();
                    }}
                    regularLink
                  >
                    {t("logout")}
                  </MobileMenuLink>
                </>
              ) : (
                <div className="hidden flex-col max-[447px]:flex">
                  <MobileMenuTitle>{t("account")}</MobileMenuTitle>
                  <MobileMenuLink
                    onClick={() => setCurrentModal({ type: "signin" })}
                  >
                    {t("login")}
                  </MobileMenuLink>
                </div>
              )}

              <div className="flex items-center justify-end gap-4 bg-blue-100-dark px-4 py-3">
                <LanguageMenu />
                <ThemeToggle />
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
      {isSearchOpen && (
        <div
          ref={searchContainerRef}
          className="fixed inset-x-0 top-12 z-40 bg-blue-200-dark p-2 shadow-md"
        >
          <GlobalSearch onSubmit={handleSearchSubmit} isMobile={true} />
        </div>
      )}
    </>
  );
};

export default MobileMenu;
