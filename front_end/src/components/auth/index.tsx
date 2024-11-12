"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { LogOut } from "@/app/(main)/accounts/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

const NavUserButton: FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();
  const t = useTranslations();

  if (!user) {
    return (
      <button
        className="w-full rounded-full bg-blue-200 px-2 text-center capitalize text-blue-900 hover:bg-blue-100"
        onClick={() => setCurrentModal({ type: "signin" })}
      >
        {t("logIn")}
      </button>
    );
  }

  return (
    <Menu>
      <MenuButton className="flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-200-dark">
        {user.username}
        <FontAwesomeIcon size="xs" icon={faChevronDown} />
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 text-white lg:border lg:border-blue-200-dark lg:bg-blue-900 lg:text-sm"
      >
        <MenuItem>
          <Link
            className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
            href={`/accounts/profile/${user.id}`}
          >
            {t("profile")}
          </Link>
        </MenuItem>
        <MenuItem>
          <Link
            className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
            href={"/accounts/settings/"}
          >
            {t("settings")}
          </Link>
        </MenuItem>
        <MenuItem>
          <Link
            className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
            href={"/?start_onboarding=true"}
          >
            {t("tutorial")}
          </Link>
        </MenuItem>
        {user.is_superuser && (
          <MenuItem>
            <Link
              className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
              href={"/admin/"}
            >
              {t("admin")}
            </Link>
          </MenuItem>
        )}
        <MenuItem>
          <a
            className="flex cursor-pointer items-center justify-center whitespace-nowrap px-4 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
            onClick={() => {
              void LogOut();
            }}
          >
            {t("logOut")}
          </a>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default NavUserButton;
