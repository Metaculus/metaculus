"use client";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Switch from "@/components/ui/switch";
import {
  Post,
  PostSubscription,
  PostSubscriptionMilestone,
  PostSubscriptionNewComments,
  PostSubscriptionSpecificTime,
  PostSubscriptionType,
} from "@/types/post";

import SubscriptionSectionMilestone from "./subscription_types_customisation/subscription_milestone";
import SubscriptionSectionNewComments from "./subscription_types_customisation/subscription_new_comments";
import SubscriptionSectionSpecificTime from "./subscription_types_customisation/subscription_specific_time";
import { getDefaultSubscriptionProps } from "./utils";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  post: Post;
  subscriptions: PostSubscription[];
};

const PostSubscribeCustomizeModal: FC<Props> = ({
  isOpen,
  onClose,
  post,
  subscriptions: _subscriptions,
}) => {
  // TODO: add localization everywhere!!!
  const t = useTranslations();

  const [subscriptions, setSubscriptions] = useState<PostSubscription[]>(
    () => _subscriptions
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchSubscription = useCallback(
    (checked: boolean, subscriptionType: PostSubscriptionType) => {
      if (checked) {
        const defaultSubscriptionProps = getDefaultSubscriptionProps();

        setSubscriptions([
          ...subscriptions,
          {
            type: subscriptionType,
            ...defaultSubscriptionProps[subscriptionType],
          } as PostSubscription,
        ]);
      } else {
        setSubscriptions([
          ...subscriptions.filter((sub) => sub.type !== subscriptionType),
        ]);
      }
    },
    [subscriptions]
  );

  const checkSubscriptionEnabled = useCallback(
    (subscriptionType: PostSubscriptionType) =>
      subscriptions.some((sub) => sub.type === subscriptionType),
    [subscriptions]
  );

  const handleSubscriptionChange = useCallback(
    (type: PostSubscriptionType, name: string, value: any) => {
      setSubscriptions(
        subscriptions.map((sub) => ({
          ...sub,
          ...(type === sub.type ? { [name]: value } : {}),
        }))
      );
    },
    [subscriptions]
  );

  const handleUnfollow = useCallback(async () => {
    setIsLoading(true);
    try {
      await changePostSubscriptions(post.id, []);
    } finally {
      setIsLoading(false);
    }

    onClose(true);
  }, [onClose, post.id]);

  const handleSubscriptionsSave = useCallback(async () => {
    // Subscribe to default notifications set
    setIsLoading(true);
    try {
      await changePostSubscriptions(post.id, subscriptions);
      onClose(true);
    } finally {
      setIsLoading(false);
    }
  }, [onClose, post.id, subscriptions]);

  const subscriptionTypes = [
    {
      type: PostSubscriptionType.NEW_COMMENTS,
      title: "Comments",
      render: (subscription: PostSubscription) => (
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
      title: "Milestones",
      render: (subscription: PostSubscription) => (
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
      title: "Specific time",
      render: (subscription: PostSubscription) => (
        <SubscriptionSectionSpecificTime
          post={post}
          subscription={subscription as PostSubscriptionSpecificTime}
          onChange={(name, value) => {
            console.log("CHANGED: ", subscription.type, name, value);
            handleSubscriptionChange(subscription.type, name, value);
          }}
        />
      ),
    },
    {
      type: PostSubscriptionType.STATUS_CHANGE,
      title: "Status changes",
    },
  ];

  return (
    <BaseModal
      label="Customize notifications"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-w-xl">
        <p className="text-base leading-tight">
          Configure email notifications when important updates happen.
        </p>
        <div className="mt-8 flex flex-col gap-4 pb-16">
          {subscriptionTypes.map(({ type, title, render }, idx) => (
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
              {checkSubscriptionEnabled(type) && (
                <>
                  <div>
                    {render &&
                      render(subscriptions.find((sub) => sub.type === type)!)}
                  </div>
                  {render && idx < subscriptionTypes.length - 1 && (
                    <hr className="mb-4 mt-8 border-gray-400 dark:border-gray-400-dark" />
                  )}
                </>
              )}
            </section>
          ))}
        </div>
        <div className="flex w-full justify-end">
          <div className="flex w-fit gap-2">
            <Button
              variant="secondary"
              disabled={isLoading}
              onClick={handleUnfollow}
            >
              {t("unfollowButton")}
            </Button>
            <Button
              variant="primary"
              disabled={isLoading}
              onClick={handleSubscriptionsSave}
            >
              {t("saveButton")}
            </Button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default PostSubscribeCustomizeModal;
