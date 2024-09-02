"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import ChangeEmailModal from "@/app/(main)/accounts/settings/components/change_email";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import Tooltip from "@/components/ui/tooltip";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const EmailNotifications: FC<Props> = ({ user }) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);

  const handleEmailSubscriptionChange = useCallback(
    async (subscriptionType: SubscriptionEmailType, checked: boolean) => {
      const subscriptionTypes = checked
        ? user.unsubscribed_mailing_tags.filter(
            (remote_type) => remote_type != subscriptionType
          )
        : Array.from(
            new Set([...user.unsubscribed_mailing_tags, subscriptionType])
          );

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
  ];

  return (
    <section className="text-sm">
      <hr />
      <h2 className="mb-5 mt-3 px-1">{t("settingsSubscriptions")}</h2>
      <h3 className="bg-blue-200 p-1 text-sm font-medium dark:bg-blue-200-dark">
        {t("settingsUserEmail")}
      </h3>
      <div className="p-1 text-sm">
        <span className="pr-8">{user.email}</span>{" "}
        <Button variant="link" onClick={() => setIsChangeEmailModalOpen(true)}>
          {t("edit")}
        </Button>
        <ChangeEmailModal
          isOpen={isChangeEmailModalOpen}
          onClose={() => setIsChangeEmailModalOpen(false)}
        />
      </div>
      <h3 className="bg-blue-200 p-1 text-sm font-medium dark:bg-blue-200-dark">
        {t("settingsEmailNotifications")}
      </h3>
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
    </section>
  );
};

export default EmailNotifications;
