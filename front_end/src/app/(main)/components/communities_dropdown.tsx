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

import { CurrentCommunity } from "@/types/community";

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex h-full items-start justify-start px-2.5 py-2 text-left text-xs font-normal capitalize text-gray-200 opacity-50">
    {children}
  </div>
);

type Props = {
  currentCommunity: CurrentCommunity | null;
};

const CommunitiesDropdown: FC<Props> = ({ currentCommunity }) => {
  const t = useTranslations();

  // TODO: fetch followed and top communities
  return (
    <Menu>
      <MenuButton className="ml-1 flex flex-col items-center justify-center gap-0 p-2 no-underline hover:bg-blue-200-dark">
        <FontAwesomeIcon size="2xs" icon={faChevronUp} className="block" />
        <FontAwesomeIcon size="2xs" icon={faChevronDown} className="block" />
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 w-[285px] overflow-hidden rounded-md border border-blue-200-dark bg-blue-900 p-2 py-2.5 text-sm text-gray-300"
      >
        {/* active community - if not followed  */}
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap rounded bg-blue-200-dark p-2.5 text-left font-bold capitalize no-underline"
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
            className="flex items-center justify-start whitespace-nowrap rounded p-2.5 text-left capitalize no-underline hover:bg-blue-200-dark"
            href={`/community/followed`}
          >
            {"David mother's community"}
          </Link>
        </MenuItem>
        {/* top-4 popular communities */}
        <SectionTitle>{t("otherCommunities")}</SectionTitle>
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap rounded p-2.5  text-left capitalize no-underline hover:bg-blue-200-dark"
            href={`/community/top-1-community/`}
          >
            {"Abstraction"}
          </Link>
        </MenuItem>
        {/* common navigation */}
        <hr className="w-[100% + 16px] -mx-2 my-2 border-gray-0/10 dark:border-gray-0/10" />
        {/* <hr className="w-[100% + 16px] -mx-2 my-2 border-gray-500 dark:border-gray-500-dark" /> */}

        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap rounded p-2.5 text-left capitalize text-blue-400 no-underline hover:bg-blue-200-dark"
            href={"/questions/"}
            // TODO: activate communities sidebar item on navigation
          >
            <FontAwesomeIcon
              size="1x"
              className="mr-2.5 text-gray-400-dark"
              icon={faMagnifyingGlass}
            />
            {t("browserAllCommunities")}
          </Link>
        </MenuItem>
        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap rounded p-2.5 text-left capitalize text-blue-400 no-underline hover:bg-blue-200-dark"
            href={"/questions/"}
          >
            <FontAwesomeIcon
              width={14}
              className="mr-2.5 text-gray-400-dark"
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
