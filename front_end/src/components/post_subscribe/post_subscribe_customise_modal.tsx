"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import { getDefaultSubscriptionProps } from "@/components/post_subscribe/subscribe_button/utils";
import SubscriptionSectionCPChange from "@/components/post_subscribe/subscription_types_customisation/subscription_cp_change";
import SubscriptionSectionMilestone from "@/components/post_subscribe/subscription_types_customisation/subscription_milestone";
import SubscriptionSectionNewComments from "@/components/post_subscribe/subscription_types_customisation/subscription_new_comments";
import SubscriptionSectionSpecificTime from "@/components/post_subscribe/subscription_types_customisation/subscription_specific_time";
import Button from "@/components/ui/button";
import Switch from "@/components/ui/switch";
import {
  Post,
  PostSubscription,
  PostSubscriptionCPCHange,
  PostSubscriptionMilestone,
  PostSubscriptionConfigItem,
  PostSubscriptionNewComments,
  PostSubscriptionSpecificTime,
  PostSubscriptionSpecificTimeConfig,
  PostSubscriptionType,
} from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  post: Post;
  subscriptions: PostSubscription[];
  onPostSubscriptionChange?: (subscription: PostSubscription[]) => void;
  showPostLink?: boolean;
  revalidate?: boolean;
};

const PostSubscribeCustomizeModal: FC<Props> = ({
  isOpen,
  onClose,
  post,
  subscriptions: initialSubscriptions,
  onPostSubscriptionChange,
  showPostLink = false,
  revalidate,
}) => {
  const t = useTranslations();

  const [modalSubscriptions, setModalSubscriptions] = useState<
    PostSubscriptionConfigItem[]
  >(parseSubscriptionForModal(initialSubscriptions));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setModalSubscriptions(
      parseSubscriptionForModal(initialSubscriptions) || []
    );
  }, [initialSubscriptions]);

  const handleSwitchSubscription = useCallback(
    (checked: boolean, subscriptionType: PostSubscriptionType) => {
      if (checked) {
        const defaultSubscriptionProps = getDefaultSubscriptionProps();

        setModalSubscriptions([
          ...modalSubscriptions,
          {
            type: subscriptionType,
            ...defaultSubscriptionProps[subscriptionType],
          } as PostSubscriptionConfigItem,
        ]);
      } else {
        setModalSubscriptions([
          ...modalSubscriptions.filter((sub) => sub.type !== subscriptionType),
        ]);
      }
    },
    [modalSubscriptions]
  );

  const checkSubscriptionEnabled = useCallback(
    (subscriptionType: PostSubscriptionType) =>
      modalSubscriptions.some((sub) => sub.type === subscriptionType),
    [modalSubscriptions]
  );

  const handleSubscriptionChange = useCallback(
    (type: PostSubscriptionType, name: string, value: any, index?: number) => {
      setModalSubscriptions(
        modalSubscriptions.map((sub) => {
          if (sub.type !== type) {
            return sub;
          }

          if (
            type === PostSubscriptionType.SPECIFIC_TIME &&
            index !== undefined
          ) {
            const specificTimeSub = sub as PostSubscriptionSpecificTimeConfig;
            return {
              ...specificTimeSub,
              subscriptions: specificTimeSub.subscriptions.map((el, idx) =>
                idx === index ? { ...el, [name]: value } : el
              ),
            };
          } else {
            return {
              ...sub,
              [name]: value,
            };
          }
        })
      );
    },
    [modalSubscriptions]
  );

  const handleUnfollow = useCallback(async () => {
    setIsLoading(true);
    try {
      const newSubscriptions = await changePostSubscriptions(
        post.id,
        [],
        revalidate
      );
      onPostSubscriptionChange?.(newSubscriptions);
      sendAnalyticsEvent("questionUnfollowed");
    } finally {
      setIsLoading(false);
    }

    onClose(true);
  }, [onClose, onPostSubscriptionChange, post.id, revalidate]);

  const handleSubscriptionsSave = useCallback(async () => {
    // Subscribe to default notifications set
    setIsLoading(true);
    const subscriptionsBE = parseSubsForBE(modalSubscriptions);
    try {
      const newSubscriptions = await changePostSubscriptions(
        post.id,
        subscriptionsBE,
        revalidate
      );
      onPostSubscriptionChange?.(newSubscriptions);
      onClose(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    modalSubscriptions,
    post.id,
    revalidate,
    onPostSubscriptionChange,
    onClose,
  ]);

  const subscriptionTypes = useMemo(
    () =>
      [
        {
          type: PostSubscriptionType.CP_CHANGE,
          title: t("followModalCommunityPredictionChanges"),
          render: (subscription: PostSubscriptionConfigItem) => (
            <SubscriptionSectionCPChange
              post={post}
              subscription={subscription as PostSubscriptionCPCHange}
              onChange={(name, value) =>
                handleSubscriptionChange(subscription.type, name, value)
              }
            />
          ),
        },
        {
          type: PostSubscriptionType.NEW_COMMENTS,
          title: t("comments"),
          render: (subscription: PostSubscriptionConfigItem) => (
            <SubscriptionSectionNewComments
              post={post}
              subscription={subscription as PostSubscriptionNewComments}
              onChange={(name, value) =>
                handleSubscriptionChange(subscription.type, name, value)
              }
            />
          ),
        },
        {
          type: PostSubscriptionType.MILESTONE,
          title: t("followModalMilestones"),
          render: (subscription: PostSubscriptionConfigItem) => (
            <SubscriptionSectionMilestone
              post={post}
              subscription={subscription as PostSubscriptionMilestone}
              onChange={(name, value) =>
                handleSubscriptionChange(subscription.type, name, value)
              }
            />
          ),
        },
        {
          type: PostSubscriptionType.SPECIFIC_TIME,
          title: t("followModalSpecificTime"),
          render: (subscription: PostSubscriptionConfigItem) => (
            <SubscriptionSectionSpecificTime
              post={post}
              subscription={subscription as PostSubscriptionSpecificTimeConfig}
              onChange={(name, value, index) => {
                handleSubscriptionChange(subscription.type, name, value, index);
              }}
            />
          ),
        },
        {
          type: PostSubscriptionType.STATUS_CHANGE,
          title: t("followModalStatusChanges"),
        },
      ].filter((obj) => {
        // We want to hide some subscription types for Notebook
        return post.notebook
          ? [
              PostSubscriptionType.NEW_COMMENTS,
              PostSubscriptionType.SPECIFIC_TIME,
            ].includes(obj.type)
          : true;
      }),
    [handleSubscriptionChange, post, t]
  );

  return (
    <BaseModal
      label={t("followModalCustomiseNotifications")}
      isOpen={isOpen}
      onClose={onClose}
      className="[&>h2]:mb-0"
    >
      <div className="max-w-md [&_p]:my-2">
        <p className="text-base leading-tight">
          {t("followModalCustomiseNotificationsParagraph")}
        </p>
        {showPostLink && (
          <div>
            <Link
              className="text-lg text-blue-800 dark:text-blue-800-dark"
              href={`/questions/${post.id}`}
            >
              {post.title}
            </Link>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-3 pb-6">
          {subscriptionTypes.map(({ type, title, render }, idx) => {
            const enabled = checkSubscriptionEnabled(type);
            const subscription = modalSubscriptions.find(
              (sub) => sub.type === type
            );

            return (
              <section key={`subscription-${type}`}>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={checkSubscriptionEnabled(type)}
                    onChange={(checked) =>
                      handleSwitchSubscription(checked, type)
                    }
                  />
                  <h4 className="m-0">{title}</h4>
                </div>
                {enabled && !!subscription && (
                  <>
                    <div>{!!render && render(subscription)}</div>
                    {!!render && idx < subscriptionTypes.length - 1 && (
                      <hr className="mb-2 mt-4 border-gray-400 dark:border-gray-400-dark" />
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
        <div className="flex w-full justify-end">
          <div className="flex w-fit gap-2">
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={handleUnfollow}
            >
              {t("followModalUnfollowButton")}
            </Button>
            <Button
              variant="primary"
              disabled={isLoading}
              onClick={handleSubscriptionsSave}
            >
              {t("saveChange")}
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

function parseSubscriptionForModal(
  subscriptions: PostSubscription[]
): PostSubscriptionConfigItem[] {
  const specificTimeSubsArray = [] as PostSubscriptionSpecificTime[];
  subscriptions.forEach((sub) => {
    if (sub.type === PostSubscriptionType.SPECIFIC_TIME) {
      specificTimeSubsArray.push(sub);
    }
  });
  const mappedSubs = [...subscriptions].filter(
    (sub) => sub.type !== PostSubscriptionType.SPECIFIC_TIME
  ) as PostSubscriptionConfigItem[];

  if (!!specificTimeSubsArray.length) {
    mappedSubs.push({
      type: PostSubscriptionType.SPECIFIC_TIME,
      subscriptions: specificTimeSubsArray,
    });
  }

  return mappedSubs;
}

function parseSubsForBE(
  subscriptions: PostSubscriptionConfigItem[]
): PostSubscription[] {
  const specificTimeSubs = subscriptions.find(
    (sub) => sub.type === PostSubscriptionType.SPECIFIC_TIME
  );

  const specificTimeSubsArray =
    !!specificTimeSubs && "subscriptions" in specificTimeSubs
      ? specificTimeSubs.subscriptions
      : null;

  const mappedSubs = [...subscriptions].filter(
    (sub) => sub.type !== PostSubscriptionType.SPECIFIC_TIME
  ) as PostSubscription[];
  if (!!specificTimeSubsArray) {
    mappedSubs.push(...specificTimeSubsArray);
  }
  return mappedSubs;
}
export default PostSubscribeCustomizeModal;
