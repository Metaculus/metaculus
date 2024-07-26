"use client";
import { Switch } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import SubscriptionSectionMilestone from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/subscription_milestone";
import SubscriptionSectionNewComments from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/subscription_new_comments";
import SubscriptionSectionSpecificTime from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/subscription_specific_time";
import { SubscriptionSectionProps } from "@/app/(main)/questions/[id]/components/subscribe_button/subscription_types_customisation/types";
import {
  getDefaultSubscriptionProps,
  getInitialSubscriptions,
} from "@/app/(main)/questions/[id]/components/subscribe_button/utils";
import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import {
  Post,
  PostSubscription,
  PostSubscriptionMilestone,
  PostSubscriptionNewComments,
  PostSubscriptionSpecificTime,
  PostSubscriptionType,
} from "@/types/post";

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
          subscription={subscription as PostSubscriptionSpecificTime}
          onChange={(name, value) => {
            console.log("CHANGED: ", subscription.type, name, value);
            handleSubscriptionChange(subscription.type, name, value);
          }}
        />
      ),
    },
  ];

  return (
    <BaseModal
      label="You’re now following this question!"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-w-xl">
        <p className="text-base leading-tight">
          You’ll be notified of new comments, changes to the Community
          Prediction, every time 20% of the question lifetime has passed, and
          when the question opens, closes, or resolves.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          {subscriptionTypes.map(({ type, title, render }) => (
            <section key={`subscription-${type}`}>
              <div className="flex items-center gap-4">
                <h4 className="m-0">{title}</h4>
                <Switch
                  checked={checkSubscriptionEnabled(type)}
                  onChange={(checked) =>
                    handleSwitchSubscription(checked, type)
                  }
                  className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition data-[checked]:bg-blue-600"
                >
                  <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                </Switch>
              </div>
              {checkSubscriptionEnabled(type) && (
                <>
                  <div>
                    {render(subscriptions.find((sub) => sub.type === type)!)}
                  </div>
                  <hr className="my-4 border-gray-400 dark:border-gray-400-dark" />
                </>
              )}
            </section>
          ))}
        </div>
        <div className="flex w-full justify-end">
          <div className="flex w-fit gap-2">
            <Button variant="secondary" disabled={isLoading}>
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
