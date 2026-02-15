"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import PreferencesSection from "@/app/(main)/accounts/settings/components/preferences_section";
import Checkbox from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Tooltip from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use_server_action";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const SiteNews: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleEmailSubscriptionChange = useCallback(
    async (subscriptionType: SubscriptionEmailType, checked: boolean) => {
      const subscriptionTypes = checked
        ? user.unsubscribed_mailing_tags.filter(
            (remote_type) => remote_type != subscriptionType
          )
        : Array.from(
            new Set([...user.unsubscribed_mailing_tags, subscriptionType])
          );

      try {
        await updateProfileAction({
          unsubscribed_mailing_tags: subscriptionTypes,
        });
      } finally {
        setLoadingIndex(null);
      }
    },
    [user.unsubscribed_mailing_tags]
  );
  const [updateProfile, isPending] = useServerAction(
    handleEmailSubscriptionChange
  );
  const options = [
    {
      type: SubscriptionEmailType.newsletter,
      label: t("newsletter"),
    },
    {
      type: SubscriptionEmailType.weekly_top_comments,
      label: t("weeklyTopComments"),
    },
    {
      type: SubscriptionEmailType.metaculus_news,
      label: t("metaculusNews"),
    },
  ];

  return (
    <PreferencesSection title={t("siteNews")}>
      <div className="flex flex-col gap-3">
        {options.map(({ type, ...opts }, index) => (
          <div className="flex items-center" key={`subscriptions-${type}`}>
            <Checkbox
              checked={!user.unsubscribed_mailing_tags.includes(type)}
              onChange={(checked) => {
                updateProfile(type, checked);
              }}
              onClick={() => setLoadingIndex(index)}
              className="p-1"
              readOnly={isPending}
              inputClassName="text-gray-900 dark:text-gray-900-dark"
              {...opts}
            />
            {loadingIndex === index && isPending && (
              <LoadingSpinner size="1x" />
            )}
          </div>
        ))}
      </div>
    </PreferencesSection>
  );
};

export default SiteNews;
