"use client";

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
import { FC, PropsWithChildren, useEffect, useState } from "react";

import LoadingSpinner from "@/components/ui/loading_spiner";
import { useAuth } from "@/contexts/auth_context";
import ClientProjectsApi from "@/services/api/projects/projects.client";
import { Community } from "@/types/projects";
import { logError } from "@/utils/core/errors";

const SectionTitle: FC<PropsWithChildren> = ({ children }) => (
  <div className="flex h-full items-start justify-start px-2.5 py-2 text-left text-xs font-normal capitalize text-gray-200 opacity-50">
    {children}
  </div>
);

type Props = {
  community: Community | null;
};

const CommunitiesDropdown: FC<Props> = ({ community }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [followedCommunities, setFollowedCommunities] = useState<Community[]>(
    []
  );
  const [topCommunities, setTopCommunities] = useState<Community[]>([]);
  const isFollowingActive = followedCommunities.some(
    (item) => item.id === community?.id
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { results: topCommunities } =
          await ClientProjectsApi.getCommunities({
            limit: 4,
          });
        setTopCommunities(topCommunities);
        if (user) {
          const { results: followedCommunities } =
            await ClientProjectsApi.getCommunities({
              is_subscribed: true,
              limit: 4,
            });
          setFollowedCommunities(followedCommunities);
        }
      } catch (e) {
        logError(e);
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [user]);

  return (
    <Menu>
      <MenuButton className="ml-1 flex flex-col items-center justify-center gap-0 rounded p-1 px-[6px] no-underline hover:bg-blue-700 data-[active]:bg-blue-700">
        <FontAwesomeIcon size="2xs" icon={faChevronUp} className="block" />
        <FontAwesomeIcon size="2xs" icon={faChevronDown} className="block" />
      </MenuButton>
      <MenuItems
        anchor="bottom"
        className="z-50 mt-1 w-[285px] overflow-hidden rounded-md border border-blue-200-dark bg-blue-900 p-2 py-2.5 text-sm text-gray-300"
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {!isFollowingActive && (
              <MenuItem>
                <Link
                  className="flex items-center justify-start whitespace-nowrap rounded bg-blue-200-dark p-2.5 text-left font-bold capitalize no-underline"
                  href={`/c/${community?.slug}`}
                >
                  {community?.name}
                  <FontAwesomeIcon
                    size="1x"
                    className="ml-auto text-gray-400 dark:text-gray-400-dark"
                    icon={faCheck}
                  />
                </Link>
              </MenuItem>
            )}

            {/* following communities - should render active community here if followed */}
            {!!followedCommunities.length && (
              <SectionTitle>{t("followingButton")}</SectionTitle>
            )}
            {followedCommunities.map((followedCommunity) =>
              followedCommunity.id === community?.id ? (
                <MenuItem key={followedCommunity.id}>
                  <Link
                    className="flex items-center justify-start whitespace-nowrap rounded bg-blue-200-dark p-2.5 text-left font-bold capitalize no-underline"
                    href={`/c/${followedCommunity?.slug}`}
                  >
                    {followedCommunity?.name}
                    <FontAwesomeIcon
                      size="1x"
                      className="ml-auto text-gray-400 dark:text-gray-400-dark"
                      icon={faCheck}
                    />
                  </Link>
                </MenuItem>
              ) : (
                <MenuItem key={followedCommunity.id}>
                  <Link
                    className="flex items-center justify-start whitespace-nowrap rounded p-2.5 text-left capitalize no-underline hover:bg-blue-200-dark"
                    href={`/c/${followedCommunity.slug}`}
                  >
                    {followedCommunity.name}
                  </Link>
                </MenuItem>
              )
            )}

            {!!topCommunities.length && (
              <SectionTitle>{t("otherCommunities")}</SectionTitle>
            )}
            {topCommunities.map((topCommunity) => (
              <MenuItem key={topCommunity.id}>
                <Link
                  className="flex items-center justify-start whitespace-nowrap rounded p-2.5  text-left capitalize no-underline hover:bg-blue-200-dark"
                  href={`/c/${topCommunity.slug}/`}
                >
                  {topCommunity.name}
                </Link>
              </MenuItem>
            ))}
          </>
        )}

        <hr className="w-[100% + 16px] -mx-2 my-2 border-gray-0/10 dark:border-gray-0/10" />

        <MenuItem>
          <Link
            className="flex items-center justify-start whitespace-nowrap rounded p-2.5 text-left capitalize text-blue-400 no-underline hover:bg-blue-200-dark"
            href={"/questions/?communities=true"}
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
