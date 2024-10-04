"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
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
  PostSubscriptionNewComments,
  PostSubscriptionSpecificTime,
  PostSubscriptionType,
} from "@/types/post";

import { getDefaultSubscriptionProps } from "../../app/(main)/questions/[id]/components/subscribe_button/utils";

type Props = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  post: Post;
  subscriptions: PostSubscription[];
  onPostSubscriptionChange?: (subscription: PostSubscription[]) => void;
  showPostLink?: boolean;
};

const PostSubscribeCustomizeModal: FC<Props> = ({
  isOpen,
  onClose,
  post,
  subscriptions: initialSubscriptions,
  onPostSubscriptionChange,
  showPostLink = false,
}) => {
  const t = useTranslations();

  const [modalSubscriptions, setModalSubscriptions] =
    useState<PostSubscription[]>(initialSubscriptions);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setModalSubscriptions(initialSubscriptions || []);
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
          } as PostSubscription,
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
    (type: PostSubscriptionType, name: string, value: any) => {
      setModalSubscriptions(
        modalSubscriptions.map((sub) => ({
          ...sub,
          ...(type === sub.type ? { [name]: value } : {}),
        }))
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
        false
      );
      onPostSubscriptionChange && onPostSubscriptionChange(newSubscriptions);
    } finally {
      setIsLoading(false);
    }

    onClose(true);
  }, [onClose, post.id]);

  const handleSubscriptionsSave = useCallback(async () => {
    // Subscribe to default notifications set
    setIsLoading(true);
    try {
      const newSubscriptions = await changePostSubscriptions(
        post.id,
        modalSubscriptions,
        false
      );
      onPostSubscriptionChange && onPostSubscriptionChange(newSubscriptions);
      onClose(true);
    } finally {
      setIsLoading(false);
    }
  }, [onClose, post.id, modalSubscriptions]);

  const subscriptionTypes = useMemo(
    () => [
      {
        type: PostSubscriptionType.CP_CHANGE,
        title: t("followModalCommunityPredictionChanges"),
        render: (subscription: PostSubscription) => (
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
        title: t("followModalMilestones"),
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
        title: t("followModalSpecificTime"),
        render: (subscription: PostSubscription) => (
          <SubscriptionSectionSpecificTime
            post={post}
            subscription={subscription as PostSubscriptionSpecificTime}
            onChange={(name, value) => {
              handleSubscriptionChange(subscription.type, name, value);
            }}
          />
        ),
      },
      {
        type: PostSubscriptionType.STATUS_CHANGE,
        title: t("followModalStatusChanges"),
      },
    ],
    [handleSubscriptionChange, post, t]
  );

  return (
    <BaseModal
      label={t("followModalCustomiseNotifications")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="max-w-md">
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
                      render(
                        modalSubscriptions.find((sub) => sub.type === type)!
                      )}
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

export default PostSubscribeCustomizeModal;
