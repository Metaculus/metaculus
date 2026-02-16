"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import PreferencesSection from "@/app/(main)/accounts/settings/components/preferences_section";
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "@/app/(main)/actions";
import Checkbox from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Tooltip from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use_server_action";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
  isNewsletterSubscribed: boolean;
};

const EmailNotifications: FC<Props> = ({ user, isNewsletterSubscribed }) => {
  const t = useTranslations();
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(
    isNewsletterSubscribed
  );

  const handleNewsletterChange = useCallback(
    async (checked: boolean) => {
      if (checked) {
        await subscribeToNewsletter(user.email);
      } else {
        // The unsubscribeFromNewsletter action does not need the email parameter as we require the user to be authenticated
        await unsubscribeFromNewsletter();
      }
      setNewsletterSubscribed(checked);
    },
    [user.email]
  );
  const [updateNewsletter, isNewsletterPending] = useServerAction(
    handleNewsletterChange
  );

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
  const siteNewsOptions = [
    {
      type: SubscriptionEmailType.weekly_top_comments,
      label: t("weeklyTopComments"),
    },
    // TODO: metaculus_news isn't a mailing tag. It's a ProjectSubscription
    // and is essentially treated as a flag on the User model. Not sure
    // how to best handle this here (this current state doesn't work).
    {
      type: SubscriptionEmailType.metaculus_news_subscription,
      label: t("metaculusNewsSubscription"),
    },
  ];
  const keepingUpOptions = [
    {
      type: SubscriptionEmailType.comment_mentions,
      label: t("settingsMentionsInComments"),
    },
    {
      type: SubscriptionEmailType.question_resolution,
      label: t("settingsQuestionResolution"),
    },
    {
      type: SubscriptionEmailType.tournament_new_questions,
      label: t("settingsNewQuestionsInTournament"),
    },
    {
      type: SubscriptionEmailType.cp_change,
      label: t("settingsSignificantMovementOnPredictedQuestions"),
      children: (
        <>
          {t("settingsSignificantMovementOnPredictedQuestions")}
          <Tooltip
            showDelayMs={200}
            placement={"top"}
            tooltipContent={t(
              "settingsSignificantMovementOnPredictedQuestionsTooltip"
            )}
            className="ml-1"
          >
            <FontAwesomeIcon icon={faCircleQuestion} size="lg" />
          </Tooltip>
        </>
      ),
    },
    {
      type: SubscriptionEmailType.before_prediction_auto_withdrawal,
      label: t("beforeAutoWithdrawal"),
    },
  ];
  const keepingUpAdditionalOptions = [
    // TODO: follow automatically on prediction isn't a mailing tag either.
    // It's a flag on the User model. Need to figure out how to handle this.
    {
      type: "follow_automatically_on_prediction",
      label: t("followAutomaticallyOnPrediction"),
    },
  ];

  return (
    <>
      <PreferencesSection title={t("siteNews")}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <Checkbox
              checked={newsletterSubscribed}
              onChange={updateNewsletter}
              className="p-1"
              readOnly={isNewsletterPending}
              inputClassName="text-gray-900 dark:text-gray-900-dark"
              label={t("settingsNewTournamentsAndPlatformUpdates")}
            />
            {isNewsletterPending && <LoadingSpinner size="1x" />}
          </div>
          {siteNewsOptions.map(({ type, ...opts }, index) => (
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
      <PreferencesSection title={t("keepingUp")}>
        <div className="flex flex-col gap-3">
          {t("receiveEmailNotificationsWhen")}
          {keepingUpOptions.map(({ type, ...opts }, index) => (
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
        <div className="flex flex-col gap-3">
          {t("autoFollow")}
          {keepingUpAdditionalOptions.map(({ type, ...opts }, index) => (
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
      {/* TODO: put Default Follow Notifications here probably */}
    </>
  );
};

export default EmailNotifications;
