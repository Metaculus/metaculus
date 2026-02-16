"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";
import { safeLocalStorage } from "@/utils/core/storage";

import { useTopCommentsCtaDismissed } from "../hooks/use_top_comments_cta_dismissed";

const SUBSCRIBE_INTENT_KEY = "weeklyTopCommentsSubscribeIntent:v1";

const SubscribeTopCommentsCta: FC = () => {
  const t = useTranslations();
  const { user, setUser } = useAuth();
  const { setCurrentModal } = useModal();
  const { dismissed, dismiss, ready } = useTopCommentsCtaDismissed();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isSubscribed = useMemo(() => {
    if (!user) {
      return false;
    }
    return !user.unsubscribed_mailing_tags.includes(
      SubscriptionEmailType.weekly_top_comments
    );
  }, [user]);

  const subscribe = useCallback(
    async (authenticatedUser: CurrentUser) => {
      if (isSubscribing) {
        return;
      }

      const nextUnsubscribedTags =
        authenticatedUser.unsubscribed_mailing_tags.filter(
          (tag) => tag !== SubscriptionEmailType.weekly_top_comments
        );
      const optimisticUser: CurrentUser = {
        ...authenticatedUser,
        unsubscribed_mailing_tags: nextUnsubscribedTags,
      };

      setIsSubscribing(true);
      setUser(optimisticUser);

      try {
        await updateProfileAction({
          unsubscribed_mailing_tags: nextUnsubscribedTags,
        });
        setIsSuccess(true);
        safeLocalStorage.removeItem(SUBSCRIBE_INTENT_KEY);
      } catch {
        setUser(authenticatedUser);
        toast.error(t("weeklyTopCommentsSubscribeError"));
      } finally {
        setIsSubscribing(false);
      }
    },
    [isSubscribing, setUser, t]
  );

  useEffect(() => {
    if (
      !user ||
      isSubscribed ||
      safeLocalStorage.getItem(SUBSCRIBE_INTENT_KEY) !== "1"
    ) {
      return;
    }

    safeLocalStorage.removeItem(SUBSCRIBE_INTENT_KEY);
    void subscribe(user);
  }, [user, isSubscribed, subscribe]);

  const handleSubscribeClick = useCallback(() => {
    if (!user) {
      safeLocalStorage.setItem(SUBSCRIBE_INTENT_KEY, "1");
      setCurrentModal({
        type: "signin",
        data: {
          onSuccess: async (authenticatedUser) => {
            await subscribe(authenticatedUser);
          },
        },
      });
      return;
    }

    void subscribe(user);
  }, [user, setCurrentModal, subscribe]);

  if (!ready || dismissed) {
    return null;
  }

  if (!isSuccess && !isSubscribing && user && isSubscribed) {
    return null;
  }

  return (
    <div
      className={cn(
        "group relative mb-6 flex flex-col items-start gap-2.5 overflow-hidden rounded-[6px] border px-5 py-4 pr-10 transition-colors duration-300",
        isSuccess
          ? "border-olive-500 bg-olive-400 dark:border-olive-500-dark dark:bg-olive-400-dark"
          : "border-blue-700 bg-[linear-gradient(-86.6deg,rgba(102,165,102,0.5)_0%,rgba(169,192,214,0.5)_100%),linear-gradient(90deg,#ffffff_0%,#ffffff_100%)] dark:border-blue-700-dark dark:bg-[linear-gradient(-86.6deg,rgba(102,165,102,0.5)_0%,rgba(99,135,168,0.5)_100%),linear-gradient(90deg,#262f38_0%,#262f38_100%)]"
      )}
    >
      {!isSuccess && (
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(-86.6deg,rgba(102,165,102,0.6)_0%,rgba(169,192,214,0.6)_100%),linear-gradient(90deg,#ffffff_0%,#ffffff_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[linear-gradient(-86.6deg,rgba(102,165,102,0.6)_0%,rgba(99,135,168,0.6)_100%),linear-gradient(90deg,#262f38_0%,#262f38_100%)]" />
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-olive-400 opacity-0 transition-opacity duration-300 dark:bg-olive-400-dark",
          isSuccess && "opacity-100"
        )}
      />
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("close")}
        className="absolute right-4 top-4 z-10 shrink-0 text-lg leading-none text-blue-900/40 transition-colors duration-300 hover:text-blue-900/60 dark:text-blue-900-dark/40 dark:hover:text-blue-900-dark/60"
      >
        <FontAwesomeIcon icon={faXmark} />
      </button>
      <div className="relative z-10 flex w-full flex-col items-start gap-2.5">
        <p className="text-base font-medium leading-6 text-blue-900 dark:text-blue-900-dark">
          {isSuccess
            ? t("weeklyTopCommentsSubscribeSuccessInline")
            : t("weeklyTopCommentsSubscribeCta")}
        </p>
        {!isSuccess && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSubscribeClick}
            disabled={isSubscribing}
            className="rounded-full border-gray-900 bg-gray-0 px-3 py-2 text-gray-900 transition-colors duration-300 hover:bg-gray-200 active:bg-gray-300 dark:border-gray-900-dark dark:bg-gray-0-dark dark:text-gray-900-dark dark:hover:bg-gray-200-dark dark:active:bg-gray-300-dark"
          >
            {t("subscribe")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SubscribeTopCommentsCta;
