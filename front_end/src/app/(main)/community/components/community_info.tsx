"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";

import communityPlaceholder from "@/app/assets/images/tournament.webp";
import { Community } from "@/types/projects";

import CommunityFollow from "./community_follow";

type Props = {
  community: Community;
};
const CommunityInfo: FC<Props> = ({ community }) => {
  const t = useTranslations();
  const [followersCount, setFollowersCount] = useState(
    community.followers_count
  );
  // for testing purpose
  // community.header_logo =
  //   "https://metaculus-media.s3.amazonaws.com/Screen_Shot_2024-06-05_at_9.28.25_AM.png";
  return (
    <div className="relative">
      <div className="flex items-center">
        <FontAwesomeIcon
          className="text-blue-700/40 dark:text-blue-700-dark/40"
          icon={faArrowLeft}
          width={20}
          size="xl"
        />
        <h1 className="m-0 ml-3 max-w-[250px] truncate text-xl font-medium text-blue-900 dark:text-blue-900-dark xs:max-w-[auto] xs:text-2xl">
          {community.name}
        </h1>
      </div>
      <p className="my-5 line-clamp-3 h-[60px] text-sm text-blue-900/60 dark:text-blue-900-dark/60 xs:line-clamp-2 xs:h-10">
        {community.description}
      </p>
      <div className="flex items-center">
        <CommunityFollow
          community={community}
          setFollowersCount={setFollowersCount}
          className="absolute right-0 top-0 xs:static"
        />
        <p className="my-0 flex flex-col gap-1 text-xs text-blue-900/60 dark:text-blue-900-dark/60 xs:ml-5 xs:flex-row">
          <span className="order-2 font-bold text-gray-700 dark:text-gray-700-dark xs:-order-1">
            {followersCount}
          </span>{" "}
          {t("followers")}
        </p>
        <p className="my-0 ml-7 flex flex-col gap-1 text-xs text-blue-900/60 dark:text-blue-900-dark/60 xs:ml-5 xs:flex-row">
          <span className="order-2 font-bold text-gray-700 dark:text-gray-700-dark xs:-order-1">
            {community.posts_count}
          </span>{" "}
          {t("questions")}
        </p>
        <div className="ml-auto flex items-center">
          <p className="my-0 ml-auto flex flex-col items-end gap-1 text-xs text-blue-900/60 dark:text-blue-900-dark/60 xs:flex-row">
            {t("moderatedBy")}{" "}
            <Link
              className="text-blue-700 no-underline dark:text-blue-700-dark"
              href={`/accounts/profile/${community.created_by?.id}/`}
            >
              {community.created_by?.username ?? "username"}
            </Link>
          </p>

          <div className="relative ml-4 h-[36px] w-[36px] rounded-full border-none bg-cover bg-center">
            <Image
              src={communityPlaceholder}
              className="absolute h-full w-full rounded-full"
              alt=""
              placeholder={"blur"}
              quality={100}
            />
            {!!community.header_logo && (
              <Image
                quality={100}
                className="size-full rounded-full object-cover object-center"
                sizes="50vw"
                fill
                src={community.header_logo}
                alt=""
              />
            )}
          </div>
        </div>
      </div>
      <hr className="-mx-3 xs:-mx-8" />
    </div>
  );
};

export default CommunityInfo;
