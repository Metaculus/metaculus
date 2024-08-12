"use client";

import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import Checkbox from "@/components/ui/checkbox";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const EmailNotifications: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubscriptionChange = useCallback(
    async (subscriptionType: SubscriptionEmailType, checked: boolean) => {
      const subscriptionTypes = checked
        ? user.unsubscribed_mailing_tags.filter(
            (remote_type) => remote_type != subscriptionType
          )
        : Array.from(
            new Set([...user.unsubscribed_mailing_tags, subscriptionType])
          );

      console.log(subscriptionTypes, subscriptionType, checked);

      setIsLoading(true);
      try {
        await updateProfileAction({
          unsubscribed_mailing_tags: subscriptionTypes,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user.unsubscribed_mailing_tags]
  );

  const options = [
    {
      type: SubscriptionEmailType.comment_mentions,
      label: t("settingsMentionsInComments"),
    },
    {
      type: SubscriptionEmailType.question_resolution,
      label: t("settingsQuestionResolution"),
    },
  ];

  const newsletterOptions = [
    {
      type: SubscriptionEmailType.newsletter,
      label: `Metaculus ${t("newsLetter")}`,
    },
  ];

  return (
    <section>
      <h2 className="mx-[-4px] mb-5 mt-3 border-t border-gray-500 px-1 pt-4">
        {t("settingsSubscriptions")}
      </h2>
      <h3 className="bg-blue-200 p-1 text-sm font-medium dark:bg-blue-800">
        {t("newsLetter")}
      </h3>
      <div className="text-sm">
        {newsletterOptions.map(({ type, ...opts }) => (
          <Checkbox
            key={`subscriptions-${type}`}
            checked={!user.unsubscribed_mailing_tags.includes(type)}
            onChange={(checked) => {
              handleEmailSubscriptionChange(type, checked).then();
            }}
            className="p-1.5"
            readOnly={isLoading}
            {...opts}
          />
        ))}
      </div>

      <h3 className="bg-blue-200 p-1 text-sm font-medium dark:bg-blue-800">
        {t("settingsEmailNotifications")}
      </h3>
      <div className="text-sm">
        {options.map(({ type, ...opts }) => (
          <Checkbox
            key={`subscriptions-${type}`}
            checked={!user.unsubscribed_mailing_tags.includes(type)}
            onChange={(checked) => {
              handleEmailSubscriptionChange(type, checked).then();
            }}
            className="p-1.5"
            readOnly={isLoading}
            {...opts}
          />
        ))}
      </div>
    </section>
  );
};

export default EmailNotifications;
