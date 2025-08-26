"use client";

import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import { usePostSubscriptionContext } from "@/contexts/post_subscription_context";

type Props = {
  mini?: boolean;
};

const PostSubscribeButton: FC<Props> = ({ mini = false }) => {
  const t = useTranslations();
  const { isSubscribed, isLoading, handleSubscribe, handleCustomize } =
    usePostSubscriptionContext();

  return (
    <>
      {isSubscribed ? (
        <Button
          variant="primary"
          presentationType={mini ? "icon" : "default"}
          disabled={isLoading}
          onClick={handleCustomize}
        >
          <FontAwesomeIcon
            icon={faBell}
            className="text-yellow-400 dark:text-yellow-600"
          />
          {!mini && t("followingButton")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          presentationType={mini ? "icon" : "default"}
          onClick={handleSubscribe}
          disabled={isLoading}
          className={mini ? "border-0" : ""}
        >
          <FontAwesomeIcon
            icon={faBell}
            className="text-gray-900 dark:text-gray-900-dark"
          />
          {!mini && t("followButton")}
        </Button>
      )}
    </>
  );
};

export default PostSubscribeButton;
