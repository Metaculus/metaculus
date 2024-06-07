"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

const NavUserButton: FC = () => {
  const { setCurrentModal } = useModal();
  const { user, setUser } = useAuth();

  return (
    <>
      {user ? (
        <Menu>
          <MenuButton className="flex h-full items-center p-3 no-underline hover:bg-blue-200-dark">
            {user.username}
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
          </MenuItems>
        </Menu>
      ) : (
        <button
          className="w-full px-4 py-1.5 text-center hover:bg-blue-400-dark lg:mx-2 lg:rounded-full lg:bg-blue-200 lg:px-2 lg:py-0 lg:text-blue-900 lg:hover:bg-blue-100"
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          Log In
        </button>
      )}
    </>
  );
};

export default NavUserButton;
