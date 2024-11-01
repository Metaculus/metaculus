"use client";

import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useRef, useState } from "react";

import communityPlaceholder from "@/app/assets/images/tournament.webp";
import Button from "@/components/ui/button";
import { useNavigation } from "@/contexts/navigation_context";
import { Community } from "@/types/projects";

import { useShowActiveCommunityContext } from "./community_context";
import CommunityFollow from "./community_follow";

type Props = {
  community: Community;
};
const CommunityInfo: FC<Props> = ({ community }) => {
  const t = useTranslations();
  const router = useRouter();
  const [followersCount, setFollowersCount] = useState(
    community.followers_count
  );
  const { previousPath } = useNavigation();
  const { setShowActiveCommunity } = useShowActiveCommunityContext();
  const communityNameRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const currentRef = communityNameRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowActiveCommunity(!entry.isIntersecting);
      },
      { threshold: 1.0 }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [communityNameRef, setShowActiveCommunity]);

  return (
    <div className="relative">
      <div className="flex items-center">
        {!!previousPath && (
          <Button
            variant="text"
            className="mr-3 !p-0"
            onClick={() => router.push(previousPath)}
          >
            <FontAwesomeIcon
              className="text-blue-700/40 dark:text-blue-700-dark/40"
              icon={faArrowLeft}
              width={20}
              size="xl"
            />
          </Button>
        )}
        <h1
          ref={communityNameRef}
          className="m-0 max-w-[250px] truncate text-xl font-medium text-blue-900 dark:text-blue-900-dark xs:max-w-full xs:text-2xl"
        >
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
        {!!community.created_by?.id && !!community.created_by?.username && (
          <div className="ml-auto flex items-center">
            <p className="my-0 ml-auto flex flex-col items-end gap-1 text-xs text-blue-900/60 dark:text-blue-900-dark/60 xs:flex-row">
              {t("moderatedBy")}{" "}
              <Link
                className="text-blue-700 no-underline dark:text-blue-700-dark"
                href={`/accounts/profile/${community.created_by.id}/`}
              >
                {community.created_by.username}
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
        )}
      </div>
      <hr className="text -mx-3 border-blue-500 dark:border-blue-600/50 xs:-mx-8" />
    </div>
  );
};

export default CommunityInfo;
