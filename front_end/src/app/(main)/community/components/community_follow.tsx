"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Community } from "@/types/projects";

import {
  subscribeProject,
  unsubscribeProject,
} from "../../(tournaments)/tournament/[slug]/actions";

type Props = {
  community: Community;
  setFollowersCount: React.Dispatch<React.SetStateAction<number>>;
  className?: string;
};

const CommunityFollow: FC<Props> = ({
  community,
  setFollowersCount,
  className,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(() => community.is_subscribed);
  const { setCurrentModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = useCallback(async () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    } else {
      setIsLoading(true);
      try {
        await subscribeProject(community.id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      } finally {
        setIsLoading(false);
      }
    }
  }, [setCurrentModal, user, community.id, setFollowersCount]);

  const handleUnfollow = useCallback(async () => {
    setIsLoading(true);

    try {
      await unsubscribeProject(community.id);
      setIsFollowing(false);
      setFollowersCount((prev) => prev - 1);
    } finally {
      setIsLoading(false);
    }
  }, [community.id, setFollowersCount]);

  return (
    <div className={classNames("w-[85px]", className)}>
      {user && isFollowing ? (
        <Button
          variant="secondary"
          disabled={isLoading}
          onClick={handleUnfollow}
          className="max-h-[32px] !border-blue-500 !text-blue-700 dark:!border-blue-500-dark dark:!text-blue-700-dark"
        >
          {t("unfollowButton")}
        </Button>
      ) : (
        <Button
          variant="primary"
          onClick={handleFollow}
          disabled={isLoading}
          className="max-h-[32px] !border-blue-500 dark:!border-blue-500-dark"
        >
          {t("followButton")}
        </Button>
      )}
    </div>
  );
};

export default CommunityFollow;
