"use client";
import {
  faArrowLeft,
  faBars,
  faMagnifyingGlass,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";

import { LogOut } from "@/app/(main)/accounts/actions";
import LanguageMenu from "@/components/language_menu";
import ThemeToggle from "@/components/theme_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { Href } from "@/types/navigation";
import { Community } from "@/types/projects";
import cn from "@/utils/cn";

import GlobalSearch from "./global_search";

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex h-full items-center justify-center px-4 pb-1 pt-2 text-sm font-medium uppercase text-gray-200 opacity-50">
    {children}
  </div>
);

export const MenuLink: FC<
  PropsWithChildren<{
    href?: Href;
    onClick?: () => void;
    regularLink?: boolean;
    className?: string;
  }>
> = ({ href, onClick, regularLink = false, children, className }) => {
  return (
    <MenuItem
      as={href ? (regularLink ? "a" : Link) : "button"}
      {...(href ? { href } : {})}
      onClick={onClick}
      className={cn(
        "flex size-full items-center justify-center px-4 py-1.5 capitalize no-underline hover:bg-blue-400-dark",
        className
      )}
    >
      {children}
    </MenuItem>
  );
};

type Props = {
  community?: Community | null;
  onClick?: (state: boolean) => void;
};

const MobileMenu: FC<Props> = ({ community, onClick }) => {
  const { user } = useAuth();
  const { PUBLIC_ALLOW_SIGNUP } = usePublicSettings();
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

  if (!!community) {
    return (
      <Menu>
        <MenuButton className="color-white flex w-12 flex-col items-center justify-center hover:bg-blue-200-dark active:bg-blue-300-dark lg:hidden lg:items-end lg:justify-end">
          {({ open }) =>
            open ? (
              <FontAwesomeIcon
                icon={faMinus}
                size="lg"
                onClick={() => onClick && onClick(false)}
              />
            ) : (
              <FontAwesomeIcon
                icon={faBars}
                size="lg"
                onClick={() => onClick && onClick(true)}
              />
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
            <SectionTitle>{t("community")}</SectionTitle>
            <MenuLink href={`/c/${community?.slug}/`}>
              {t("questions")}
            </MenuLink>
            <MenuLink
              href={`/questions/create/?community_id=${community.id}`}
              className="mx-auto flex !w-[max-content] items-center rounded-full bg-blue-300-dark !px-2.5 !py-1 text-sm capitalize no-underline hover:bg-blue-200-dark"
            >
              <FontAwesomeIcon size="1x" className="mr-1" icon={faPlus} />
              {t("createQuestion")}
            </MenuLink>

            <SectionTitle>{t("account")}</SectionTitle>
            {user ? (
              <>
                <MenuLink href={`/accounts/profile/${user.id}`}>
                  {t("profile")}
                </MenuLink>
                <MenuLink href={"/accounts/settings/"}>
                  {t("settings")}
                </MenuLink>
                <MenuLink
                  onClick={() => setCurrentModal({ type: "onboarding" })}
                >
                  {t("tutorial")}
                </MenuLink>
                {user.is_superuser && (
                  <>
                    {!PUBLIC_ALLOW_SIGNUP && (
                      <MenuLink href={"/accounts/invite/"}>
                        {t("signupInviteUsers")}
                      </MenuLink>
                    )}
                    <MenuLink href={"/admin"}>{t("admin")}</MenuLink>
                  </>
                )}
                <MenuLink
                  onClick={() => {
                    void LogOut();
                  }}
                  regularLink
                >
                  {t("logout")}
                </MenuLink>
              </>
            ) : (
              <MenuLink onClick={() => setCurrentModal({ type: "signin" })}>
                {t("login")}
              </MenuLink>
            )}

            <div className="flex items-center justify-end gap-4 bg-blue-100-dark px-4 py-3">
              <MenuLink
                href={"/questions"}
                className="mr-auto !w-[max-content] rounded-full bg-blue-300-dark !px-2.5 !py-1 text-sm !normal-case no-underline"
              >
                <FontAwesomeIcon
                  size="1x"
                  className="mr-1.5"
                  icon={faArrowLeft}
                />
                {t("backTo")} Metaculus
              </MenuLink>
              <LanguageMenu />
              <ThemeToggle />
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    );
  }

  return (
    <>
      <div className="flex items-center lg:hidden">
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
              <MenuLink href={`/leaderboard`}>{t("leaderboards")}</MenuLink>
              <MenuLink href={`/news/`}>{t("news")}</MenuLink>
              <SectionTitle>{t("more")}</SectionTitle>
              <MenuLink href={`/about/`}>{t("aboutMetaculus")}</MenuLink>
              <MenuLink href={`/press/`}>{t("forJournalists")}</MenuLink>
              <MenuLink href={`/faq/`}>{t("faq")}</MenuLink>
              <MenuLink href={`/questions/track-record/`}>
                {t("trackRecord")}
              </MenuLink>
              <MenuLink href={`/project/journal/`}>{t("theJournal")}</MenuLink>
              <MenuLink href="/aggregation-explorer">
                {t("aggregationExplorer")}
              </MenuLink>
              <MenuLink href={`/questions/create/`}>+ {t("create")}</MenuLink>
              <SectionTitle>{t("account")}</SectionTitle>
              {user ? (
                <>
                  <MenuLink href={`/accounts/profile/${user.id}`}>
                    {t("profile")}
                  </MenuLink>
                  <MenuLink href={"/accounts/settings/"}>
                    {t("settings")}
                  </MenuLink>
                  <MenuLink
                    onClick={() => setCurrentModal({ type: "onboarding" })}
                  >
                    {t("tutorial")}
                  </MenuLink>
                  <>
                    {!PUBLIC_ALLOW_SIGNUP && (
                      <MenuLink href={"/accounts/invite/"}>
                        {t("signupInviteUsers")}
                      </MenuLink>
                    )}
                    <MenuLink href={"/admin"}>{t("admin")}</MenuLink>
                  </>
                  <MenuLink
                    onClick={() => {
                      void LogOut();
                    }}
                    regularLink
                  >
                    {t("logout")}
                  </MenuLink>
                </>
              ) : (
                <MenuLink onClick={() => setCurrentModal({ type: "signin" })}>
                  {t("login")}
                </MenuLink>
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
