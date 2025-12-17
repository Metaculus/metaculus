"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useLocale } from "next-intl";
import { FC } from "react";

import { updateLanguagePreference } from "@/app/(main)/accounts/profile/actions";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

type Props = {
  className?: string;
};

export const APP_LANGUAGES = [
  {
    name: "English",
    locale: "en",
  },
  {
    name: "Čeština",
    locale: "cs",
  },
  {
    name: "Español",
    locale: "es",
  },
  {
    name: "Portuguese",
    locale: "pt",
  },
  {
    name: "中文",
    locale: "zh",
  },
  {
    name: "繁體中文",
    locale: "zh-TW",
  },
  {
    name: "Untranslated",
    locale: "original", // Check the translations documentation why this is the case
  },
];

const LanguageMenu: FC<Props> = ({ className }) => {
  const locale = useLocale();

  return (
    <Menu>
      <MenuButton
        aria-label="change language"
        className={cn(
          "flex h-full items-center text-lg no-underline",
          className
        )}
      >
        <span className="text-blue-500">a</span>/
        <span className="text-red-400">文</span>
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-[200] border border-blue-200-dark bg-blue-900 text-sm text-gray-0 md:z-100 md:mt-2"
      >
        {APP_LANGUAGES.map((item) => {
          return (
            <MenuItem
              key={item.locale}
              as="button"
              className={cn(
                "flex w-full justify-end whitespace-nowrap px-6 py-1.5 hover:bg-blue-200-dark",
                locale == item.locale && "bg-blue-400-dark"
              )}
              onClick={(e) => {
                e.preventDefault();
                updateLanguagePreference(item.locale, false)
                  .then(() => window.location.reload())
                  .catch(logError);
              }}
              name="language"
              value={item.locale}
            >
              {item.name}
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
};

export const SetOriginalLanguage = (
  params: URLSearchParams,
  router: AppRouterInstance,
  pathname: string
) => {
  const originalLangCode = "original";
  params.delete("locale");
  // TODO: fix this too. See more details above, at the previous call
  window.location.href = pathname + "?locale=" + originalLangCode;
};

export default LanguageMenu;
