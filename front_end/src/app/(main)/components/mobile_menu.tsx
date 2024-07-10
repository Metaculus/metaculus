"use client";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import ThemeToggle from "@/components/theme_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Href } from "@/types/navigation";

const MobileMenu: FC = () => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const t = useTranslations();

  return (
    <Menu>
      <MenuButton className="color-white flex w-12 flex-col items-center justify-center hover:bg-blue-200-dark active:bg-blue-300-dark lg:hidden lg:items-end lg:justify-end">
        {({ open }) => (open ? <CloseHamburgerIcon /> : <HamburgerIcon />)}
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
          <MenuLink href={`/news/`}>{t("News")}</MenuLink>
          <SectionTitle>{t("More")}</SectionTitle>
          <MenuLink href={`/about/`}>{t("About Metaculus")}</MenuLink>
          <MenuLink href={`/press/`}>{t("For Journalists")}</MenuLink>
          <MenuLink href={`/faq/`}>{t("FAQ")}</MenuLink>
          <MenuLink href={`/questions/track-record/`}>
            {t("Track Record")}
          </MenuLink>
          <MenuLink href={`/project/journal/`}>{t("The Journal")}</MenuLink>
          <MenuLink href={`/questions/create/`}>+ {t("Write")}</MenuLink>
          <SectionTitle>{t("Account")}</SectionTitle>
          {user ? (
            <>
              <MenuLink href={`/accounts/profile/${user.id}`}>
                {t("profile")}
              </MenuLink>
              <MenuLink href={"/accounts/settings/"}>{t("Settings")}</MenuLink>
              <MenuLink href="/accounts/signout" regularLink>
                {t("Logout")}
              </MenuLink>
            </>
          ) : (
            <MenuLink onClick={() => setCurrentModal({ type: "signin" })}>
              {t("Login")}
            </MenuLink>
          )}

          <div className="flex items-center justify-between bg-blue-900 px-4 py-3">
            <div />
            <ThemeToggle />
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex h-full items-center justify-center px-4 pb-1 pt-2 text-sm font-medium uppercase text-gray-200 opacity-50">
    {children}
  </div>
);

const MenuLink: FC<
  PropsWithChildren<{
    href?: Href;
    onClick?: () => void;
    regularLink?: boolean;
  }>
> = ({ href, onClick, regularLink = false, children }) => {
  return (
    <MenuItem
      as={href ? (regularLink ? "a" : Link) : "button"}
      {...(href ? { href } : {})}
      onClick={onClick}
      className="flex size-full items-center justify-center px-4 py-1.5 no-underline hover:bg-blue-400-dark"
    >
      {children}
    </MenuItem>
  );
};

const HamburgerIcon: FC = () => (
  <svg
    width="18"
    height="16"
    viewBox="0 0 18 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-white"
      d="M0 0H18V2H0V0ZM0 7H18V9H0V7ZM0 14H18V16H0V14Z"
    />
  </svg>
);

const CloseHamburgerIcon: FC = () => (
  <svg
    width="18"
    height="16"
    viewBox="0 0 18 16"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path className="fill-white" d="M0 7H18V9H0V7Z" />
  </svg>
);

export default MobileMenu;
