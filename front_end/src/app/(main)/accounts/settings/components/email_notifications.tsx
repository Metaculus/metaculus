"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import ChangeEmailModal from "@/app/(main)/accounts/settings/components/change_email";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Tooltip from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use_server_action";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
};

const EmailNotifications: FC<Props> = ({ user }) => {
  const t = useTranslations();

  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
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
    {
      type: SubscriptionEmailType.weekly_top_comments,
      label: t("weeklyTopComments"),
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
      {options.map(({ type, ...opts }, index) => (
        <div className="flex items-center" key={`subscriptions-${type}`}>
          <Checkbox
            checked={!user.unsubscribed_mailing_tags.includes(type)}
            onChange={(checked) => {
              updateProfile(type, checked);
            }}
            onClick={() => setLoadingIndex(index)}
            className="p-1.5"
            readOnly={isPending}
            {...opts}
          />
          {loadingIndex === index && isPending && <LoadingSpinner size="1x" />}
        </div>
      ))}
    </section>
  );
};

export default EmailNotifications;
