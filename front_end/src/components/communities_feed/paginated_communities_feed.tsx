"use client";
import { useTranslations } from "next-intl";
import React, { FC, useState } from "react";

import { fetchMoreCommunities } from "@/app/(main)/c/actions";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import { Community } from "@/types/projects";
import { logError } from "@/utils/core/errors";

import CommunityFeedCard from "./community_feed_card";
import { FormErrorMessage } from "../ui/form_field";

export type PostsFeedType = "posts" | "news";

type Props = {
  initialCommunities: Community[];
  followedCommunities: Community[];
};

const PaginatedCommunitiesFeed: FC<Props> = ({
  initialCommunities,
  followedCommunities,
}) => {
  const t = useTranslations();

  const [paginatedCommunities, setPaginatedCommunities] =
    useState<Community[]>(initialCommunities);
  const [offset, setOffset] = useState(POSTS_PER_PAGE);
  const [hasMoreData, setHasMoreData] = useState(
    paginatedCommunities.length >= POSTS_PER_PAGE
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<
    (Error & { digest?: string }) | undefined
  >();

  const loadMoreCommunities = async () => {
    if (hasMoreData) {
      setIsLoading(true);
      setError(undefined);
      try {
        const { newCommunities, hasNextPage } = await fetchMoreCommunities(
          offset,
          POSTS_PER_PAGE
        );

        if (!hasNextPage) setHasMoreData(false);
        setPaginatedCommunities((prevPosts) => [
          ...prevPosts,
          ...newCommunities,
        ]);
        setOffset((prevOffset) => prevOffset + POSTS_PER_PAGE);
      } catch (err) {
        logError(err);
        const error = err as Error & { digest?: string };
        setError(error);
      } finally {
        setIsLoading(false);
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[780px]">
      <div className="mb-4 rounded-md border border-purple-300 bg-purple-100 px-5 py-4 text-base font-normal leading-6 dark:border-purple-300-dark dark:bg-purple-100-dark">
        {t.rich("introducingCommunities", {
          bold: (chunks) => (
            <span className="text-base font-bold leading-6 text-purple-800 dark:text-purple-800-dark">
              {chunks}
            </span>
          ),
        })}
        <p>
          {t.rich("introducingCommunitiesContact", {
            contact: (chunks) => (
              <a href="mailto:christian@metaculus.com">{chunks}</a>
            ),
          })}
        </p>
      </div>
      {!!followedCommunities.length && (
        <>
          <p className="m-0 mb-4 text-base capitalize leading-6 text-gray-600 dark:text-gray-600-dark">
            {t("followingCommunities")}
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {followedCommunities.map((community) => (
              <CommunityFeedCard community={community} key={community.id} />
            ))}
          </div>
        </>
      )}
      {!!followedCommunities.length && (
        <p className="m-0 my-4 text-base capitalize leading-6 text-gray-600 dark:text-gray-600-dark">
          {t("allCommunities")}
        </p>
      )}
      {!paginatedCommunities.length && (
        <span className="mt-3 text-center text-sm text-gray-900 dark:text-gray-900-dark">
          {t("noResults") + "."}
        </span>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {paginatedCommunities.map((community) => (
          <CommunityFeedCard community={community} key={community.id} />
        ))}
      </div>

      {hasMoreData ? (
        <div className="flex py-5">
          {isLoading ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <div className="mx-auto flex flex-col items-center">
              <FormErrorMessage errors={error?.digest} />
              <Button className="mx-auto" onClick={loadMoreCommunities}>
                {t("loadMoreButton")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="m-8"></div>
      )}
    </div>
  );
};

export default PaginatedCommunitiesFeed;
