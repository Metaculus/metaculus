"use client";
import {
  faArrowLeft,
  faBars,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC } from "react";

import LanguageMenu from "@/components/language_menu";
import ThemeToggle from "@/components/theme_toggle";
import { Community } from "@/types/projects";

import MobileMenuLink from "./mobile_menu_link";
import MobileMenuTitle from "./mobile_menu_title";
import useNavbarLinks from "../hooks/useNavbarLinks";
type Props = {
  community: Community | null;
  onClick?: (state: boolean) => void;
};

const CommunityMobileMenu: FC<Props> = ({ community, onClick }) => {
  const t = useTranslations();
  const { mobileMenuLinks } = useNavbarLinks({ community });
  const { mainLinks, accountLinks } = mobileMenuLinks;
  const allLinks = [...mainLinks, ...accountLinks];

  if (!community) {
    return null;
  }

  return (
    <Menu>
      <MenuButton className="color-white flex w-12 flex-col items-center justify-center hover:bg-blue-200-dark active:bg-blue-300-dark lg:hidden lg:items-end lg:justify-end">
        {({ open }) =>
          open ? (
            <FontAwesomeIcon
              icon={faMinus}
              size="lg"
              onClick={() => onClick?.(false)}
            />
          ) : (
            <FontAwesomeIcon
              icon={faBars}
              size="lg"
              onClick={() => onClick?.(true)}
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
          {allLinks.map((link, index) => {
            if (link.isTitle) {
              return (
                <MobileMenuTitle key={index} className={link.className}>
                  {link.label}
                </MobileMenuTitle>
              );
            }
            return (
              <MobileMenuLink
                key={index}
                href={link.href ?? undefined}
                className={link.className}
                onClick={link.onClick}
              >
                {link.label}
              </MobileMenuLink>
            );
          })}

          <div className="flex items-center justify-end gap-4 bg-blue-100-dark px-4 py-3">
            <MobileMenuLink
              href={"/questions"}
              className="mr-auto !w-[max-content] rounded-full bg-blue-300-dark !px-2.5 !py-1 text-sm !normal-case no-underline"
            >
              <FontAwesomeIcon
                size="1x"
                className="mr-1.5"
                icon={faArrowLeft}
              />
              {t("backTo")} Metaculus
            </MobileMenuLink>
            <LanguageMenu />
            <ThemeToggle />
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export default CommunityMobileMenu;
