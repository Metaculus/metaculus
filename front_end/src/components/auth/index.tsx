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
import { usePublicSettings } from "@/contexts/public_settings_context";
import cn from "@/utils/cn";
import { formatUsername } from "@/utils/users";

type Props = {
  btnClassName?: string;
};

const NavUserButton: FC<Props> = ({ btnClassName }) => {
  const { setCurrentModal } = useModal();
  const { PUBLIC_ALLOW_SIGNUP } = usePublicSettings();
  const { user } = useAuth();
  const t = useTranslations();
  const { PUBLIC_ALLOW_TUTORIAL } = usePublicSettings();

  if (!user) {
    return (
      <div className="ml-auto mr-2 flex h-full items-center gap-2 p-0 sm:ml-9">
        <button
          className="hidden h-full w-full whitespace-nowrap px-2 text-center capitalize hover:bg-blue-700 min-[375px]:block"
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          {t("logIn")}
        </button>
        <button
          className="h-6 w-full whitespace-nowrap rounded-full bg-blue-200 px-2 text-center capitalize text-blue-900 hover:bg-blue-100"
          onClick={() => setCurrentModal({ type: "signup" })}
        >
          {t("createAnAccount")}
        </button>
      </div>
    );
  }

  return (
    <Menu>
      <MenuButton
        className={cn(
          "ml-6 flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-200-dark",
          btnClassName
        )}
      >
        {formatUsername(user)}
        <FontAwesomeIcon size="xs" icon={faChevronDown} />
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 border border-blue-200-dark bg-blue-900 text-sm text-white"
      >
        <MenuItem>
          <Link
            className="flex items-center justify-center whitespace-nowrap px-6 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:text-right lg:hover:bg-blue-200-dark"
            href={`/accounts/profile/${user.id}`}
          >
            {t("profile")}
          </Link>
        </MenuItem>
        <MenuItem>
          <Link
            className="flex items-center justify-center whitespace-nowrap px-6 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:text-right lg:hover:bg-blue-200-dark"
            href={"/accounts/settings/"}
          >
            {t("settings")}
          </Link>
        </MenuItem>
        {PUBLIC_ALLOW_TUTORIAL && (
          <MenuItem>
            <a
              className="flex cursor-pointer items-center justify-center whitespace-nowrap px-6 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:text-right lg:hover:bg-blue-200-dark"
              onClick={() => setCurrentModal({ type: "onboarding" })}
            >
              {t("tutorial")}
            </a>
          </MenuItem>
        )}
        {user.is_superuser && (
          <>
            {!PUBLIC_ALLOW_SIGNUP && (
              <MenuItem>
                <Link
                  className="flex items-center justify-center whitespace-nowrap px-6 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:text-right lg:hover:bg-blue-200-dark"
                  href={"/accounts/invite/"}
                >
                  {t("signupInviteUsers")}
                </Link>
              </MenuItem>
            )}
            <MenuItem>
              <Link
                className="flex items-center justify-center whitespace-nowrap px-6 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:text-right lg:hover:bg-blue-200-dark"
                href={"/admin/"}
              >
                {t("admin")}
              </Link>
            </MenuItem>
          </>
        )}
        <MenuItem>
          <a
            className="flex cursor-pointer items-center justify-center whitespace-nowrap px-6 py-1.5 capitalize no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:text-right lg:hover:bg-blue-200-dark"
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
