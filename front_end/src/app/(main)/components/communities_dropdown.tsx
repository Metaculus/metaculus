import {
  faArrowLeft,
  faChevronUp,
  faChevronDown,
  faMagnifyingGlass,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { useCommunity } from "@/contexts/community_provider";

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex h-full items-start justify-start px-3 py-1  text-left text-xs font-medium capitalize text-gray-200 opacity-50">
    {children}
  </div>
);

const CommunitiesDropdown: FC = () => {
  const t = useTranslations();
  const { currentCommunity } = useCommunity();
  // TODO: fetch followed and top communities
  return (
    <Menu>
      <MenuButton className="flex flex-col items-center justify-center gap-0 p-2 no-underline hover:bg-blue-200-dark">
        <FontAwesomeIcon size="2xs" icon={faChevronUp} className="block" />
        <FontAwesomeIcon size="2xs" icon={faChevronDown} className="block" />
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 w-[285px] overflow-hidden rounded-md p-2 text-white lg:border lg:border-blue-200-dark lg:bg-blue-900 lg:text-sm"
      >
        {/* active community - if not followed  */}
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap bg-blue-200-dark px-1 py-1.5 text-left capitalize no-underline lg:px-3"
            href={`/community/${currentCommunity?.slug}`}
          >
            {currentCommunity?.name}
            <FontAwesomeIcon
              size="1x"
              className="ml-auto text-gray-400 dark:text-gray-400-dark"
              icon={faCheck}
            />
          </Link>
        </MenuItem>
        {/* following communities - should render active community here if followed */}
        <SectionTitle>{t("followingButton")}</SectionTitle>
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap px-1 py-1.5 text-left capitalize no-underline hover:bg-blue-200-dark lg:px-3"
            href={`/`}
          >
            Followed community name
          </Link>
        </MenuItem>
        {/* top-4 popular communities */}
        <SectionTitle>{t("otherCommunities")}</SectionTitle>
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap px-1 py-1.5 text-left capitalize no-underline hover:bg-blue-200-dark lg:px-3"
            href={`/community/slug/`}
          >
            Top-1 community
          </Link>
        </MenuItem>
        {/* common navigation */}
        <hr className="w-[100% + 16px] -mx-2 my-1 border-gray-400 dark:border-gray-400-dark" />

        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap px-1 py-1.5 text-left capitalize no-underline hover:bg-blue-200-dark lg:px-3"
            href={"/questions/"}
            // TODO: activate communities sidebar item on navigation
          >
            <FontAwesomeIcon
              size="1x"
              className="mr-3 text-gray-400 dark:text-gray-400-dark"
              icon={faMagnifyingGlass}
            />
            {t("browserAllCommunities")}
          </Link>
        </MenuItem>
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap px-1 py-1.5 text-left capitalize no-underline hover:bg-blue-200-dark lg:px-3"
            href={"/questions/"}
          >
            <FontAwesomeIcon
              size="1x"
              className="mr-3 text-gray-400 dark:text-gray-400-dark"
              icon={faArrowLeft}
            />
            {t("backTo")} Metaculus
          </Link>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
};

export default CommunitiesDropdown;
