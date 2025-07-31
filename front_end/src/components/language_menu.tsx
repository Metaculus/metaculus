"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { FC } from "react";

import useSearchParams from "@/hooks/use_search_params";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

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
];

const LanguageMenu: FC<Props> = ({ className }) => {
  const { params } = useSearchParams();
  const pathname = usePathname();
  const locale = useLocale();

  const languageMenuItems = [
    ...APP_LANGUAGES,
    {
      name: "Untranslated",
      locale: "original", // Check the translations documentation why this is the case
    },
  ];

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
        {languageMenuItems.map((item) => {
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
                params.delete("locale");
                params.append("locale", item.locale);
                sendAnalyticsEvent("translate", { event_label: item.locale });
                // Certain pages do not trigger an update after calling router.refresh()
                // so for now I am using a forced page reload when changing the language.
                // Even though this is horrible, changing the language is not a common
                // action, so it's ok as the initial implementation
                // TODO: remove the reload() call from here, and properly fix those pages
                // which don't render the new language content when calling router.refresh()
                window.location.href = pathname + "?" + params.toString();
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
