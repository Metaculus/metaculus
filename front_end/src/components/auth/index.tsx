"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

const NavUserButton: FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  return (
    <>
      {user ? (
        <Menu>
          <MenuButton className="flex h-full items-center gap-1 p-3 no-underline hover:bg-blue-200-dark">
            {user.username}
            <DropdownIcon />
          </MenuButton>
          <MenuItems
            anchor="bottom"
            className="z-50 text-white lg:border lg:border-blue-200-dark lg:bg-blue-900 lg:text-sm"
          >
            <MenuItem>
              <Link
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
                href={`/accounts/profile/${user.id}`}
              >
                Profile
              </Link>
            </MenuItem>
            <MenuItem>
              <Link
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
                href={"/accounts/settings/"}
              >
                Settings
              </Link>
            </MenuItem>
            <MenuItem>
              <a
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
                href="/accounts/signout"
              >
                Log Out
              </a>
            </MenuItem>
            <MenuItem>
              <a
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-blue-200-dark"
                href="http://localhost:8000/admin/"
              >
                Admin
              </a>
            </MenuItem>
          </MenuItems>
        </Menu>
      ) : (
        <button
          className="w-full rounded-full bg-blue-200 px-2 text-center text-blue-900 hover:bg-blue-100"
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          Log In
        </button>
      )}
    </>
  );
};

export const DropdownIcon: FC = () => (
  <svg
    width="10"
    height="6"
    viewBox="0 0 10 6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-white"
      d="M5.00008 6.00002L0.75708 1.75702L2.17208 0.343018L5.00008 3.17202L7.82808 0.343018L9.24308 1.75702L5.00008 6.00002Z"
    />
  </svg>
);

export default NavUserButton;
