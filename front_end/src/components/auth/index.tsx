"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { FC } from "react";

import { useModal } from "@/contexts/modal_context";
import { useUser } from "@/contexts/user_context";

const NavUserButton: FC = () => {
  const { setModalType } = useModal();
  const { user, setUser } = useUser();

  return (
    <>
      {user ? (
        <Menu>
          <MenuButton className="flex h-full items-center p-3 no-underline hover:bg-metac-blue-200-dark">
            {user.username}
          </MenuButton>
          <MenuItems
            anchor="bottom"
            className="z-50 text-white lg:border lg:border-metac-blue-200-dark lg:bg-metac-blue-900 lg:text-sm"
          >
            <MenuItem>
              <a
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-metac-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-metac-blue-200-dark"
                href="/settings"
              >
                Profile
              </a>
            </MenuItem>
            <MenuItem>
              <a
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-metac-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-metac-blue-200-dark"
                onClick={() => setUser(null)}
              >
                Settings
              </a>
            </MenuItem>
            <MenuItem>
              <a
                className="flex items-center justify-center whitespace-nowrap px-4 py-1.5 no-underline hover:bg-metac-blue-400-dark lg:items-end lg:justify-end lg:px-6 lg:text-right lg:hover:bg-metac-blue-200-dark"
                href="/auth/signout"
              >
                Log Out
              </a>
            </MenuItem>
          </MenuItems>
        </Menu>
      ) : (
        <button
          className="w-full px-4 py-1.5 text-center hover:bg-metac-blue-400-dark lg:mx-2 lg:rounded-full lg:bg-metac-blue-200 lg:px-2 lg:py-0 lg:text-metac-blue-900 lg:hover:bg-metac-blue-100"
          onClick={() => setModalType("signin")}
        >
          Log In
        </button>
      )}
    </>
  );
};

export default NavUserButton;
