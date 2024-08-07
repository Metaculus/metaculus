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
      console.log("YEAH");

      const subscriptionTypes = checked
        ? Array.from(
            new Set([...user.unsubscribed_mailing_tags, subscriptionType])
          )
        : user.unsubscribed_mailing_tags.filter(
            (remote_type) => remote_type != subscriptionType
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

  return (
    <section>
      <h2>{t("settingsSubscriptions")}</h2>
      <h3 className="bg-blue-200 p-1 text-sm font-medium">
        {t("settingsEmailNotifications")}
      </h3>
      <div className="text-sm">
        {options.map(({ type, ...opts }) => (
          <Checkbox
            key={`subscriptions-${type}`}
            checked={user.unsubscribed_mailing_tags.includes(type)}
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
