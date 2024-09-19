"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import classNames from "classnames";
import { usePathname, useRouter } from "next/navigation";
import { FC } from "react";

import useSearchParams from "@/hooks/use_search_params";

type Props = {
  className?: string;
};

const LanguageMenu: FC<Props> = ({ className }) => {
  const router = useRouter();
  const { params } = useSearchParams();
  const pathname = usePathname();

  return (
    <Menu>
      <MenuButton
        aria-label="change language"
        className={classNames(
          "flex h-full items-center text-lg no-underline",
          className
        )}
      >
        <span className="text-blue-500">a</span>/
        <span className="text-red-400">文</span>
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 border border-blue-200-dark bg-blue-900 text-sm text-gray-0"
      >
        <MenuItem
          as="button"
          className="flex w-full justify-end whitespace-nowrap px-6 py-1.5 hover:bg-blue-200-dark"
          onClick={(e) => {
            e.preventDefault();
            params.delete("locale");
            params.append("locale", "en");
            router.push(pathname + "?" + params.toString());
            router.refresh();
          }}
          name="language"
          value="en"
        >
          English
        </MenuItem>
        <MenuItem
          as="button"
          className="flex w-full justify-end whitespace-nowrap px-6 py-1.5 hover:bg-blue-200-dark"
          onClick={(e) => {
            e.preventDefault();
            params.delete("locale");
            params.append("locale", "cs");
            router.push(pathname + "?" + params.toString());
            router.refresh();
          }}
          name="language"
          value="cs"
        >
          Čeština
        </MenuItem>
        <MenuItem
          as="button"
          className="flex w-full justify-end whitespace-nowrap px-6 py-1.5 hover:bg-blue-200-dark"
          onClick={(e) => {
            e.preventDefault();
            params.delete("locale");
            params.append("locale", "es");
            router.push(pathname + "?" + params.toString());
            router.refresh();
          }}
          name="language"
          value="es"
        >
          Español
        </MenuItem>
        <MenuItem
          as="button"
          className="flex w-full justify-end whitespace-nowrap px-6 py-1.5 hover:bg-blue-200-dark"
          onClick={(e) => {
            e.preventDefault();
            params.delete("locale");
            params.append("locale", "zh");
            router.push(pathname + "?" + params.toString());
            router.refresh();
          }}
          name="language"
          value="zh"
        >
          中文
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default LanguageMenu;
