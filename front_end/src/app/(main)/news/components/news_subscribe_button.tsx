"use client";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import {
  subscribeProject,
  unsubscribeProject,
} from "@/app/(main)/(tournaments)/tournament/[slug]/actions";
import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";
import { NewsCategory } from "@/types/projects";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";

type Props = {
  user?: CurrentUser | null;
  categories: NewsCategory[];
  mini?: boolean;
};

const NewsSubscribeButton: FC<Props> = ({ user, categories, mini }) => {
  const t = useTranslations();
  const [isFollowing, setIsFollowing] = useState(() =>
    categories.some((obj) => obj.is_subscribed)
  );
  const { setCurrentModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
    } else {
      setIsLoading(true);

      try {
        await Promise.all(categories.map((obj) => subscribeProject(obj.id)));
        setIsFollowing(true);
      } finally {
        setIsLoading(false);
      }
    }
  }, [setCurrentModal, categories, user]);

  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      await Promise.all(categories.map((obj) => unsubscribeProject(obj.id)));
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  }, [categories]);

  return (
    <>
      {user && isFollowing ? (
        <Button
          variant="primary"
          className={cn({ "min-w-28": !mini })}
          disabled={isLoading}
          onClick={handleUnsubscribe}
        >
          <FontAwesomeIcon icon={faBell} />
          {!mini && t("unfollowButton")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          className={cn({ "min-w-28": !mini })}
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faBell} />
          {!mini && t("followButton")}
        </Button>
      )}
    </>
  );
};

export default NewsSubscribeButton;
