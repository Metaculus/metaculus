"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import PreferencesSection from "@/app/(main)/accounts/settings/components/preferences_section";
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
} from "@/app/(main)/actions";
import ButtonGroup, { type GroupButton } from "@/components/ui/button_group";
import LoadingSpinner from "@/components/ui/loading_spiner";
import Switch from "@/components/ui/switch";
import Tooltip from "@/components/ui/tooltip";
import { useServerAction } from "@/hooks/use_server_action";
import { SubscriptionEmailType } from "@/types/notifications";
import { CPChangeThreshold } from "@/types/post";
import { CurrentUser } from "@/types/users";

export type Props = {
  user: CurrentUser;
  isNewsletterSubscribed: boolean;
};

type CpKey = "small" | "medium" | "large";

const cpKeyToValue = (k: CpKey): CPChangeThreshold =>
  k === "small"
    ? CPChangeThreshold.SMALL
    : k === "medium"
      ? CPChangeThreshold.MEDIUM
      : CPChangeThreshold.LARGE;

const cpValueToKey = (v: number): CpKey =>
  v === CPChangeThreshold.SMALL
    ? "small"
    : v === CPChangeThreshold.MEDIUM
      ? "medium"
      : "large";

const COMMENTS_BUTTONS: GroupButton<"1" | "3" | "10">[] = [
  { value: "1", label: "1" },
  { value: "3", label: "3" },
  { value: "10", label: "10" },
];

const MILESTONE_BUTTONS: GroupButton<"1" | "5" | "10" | "20">[] = [
  { value: "1", label: "1%" },
  { value: "5", label: "5%" },
  { value: "10", label: "10%" },
  { value: "20", label: "20%" },
];

const EmailNotifications: FC<Props> = ({ user, isNewsletterSubscribed }) => {
  const t = useTranslations();

  const cpButtons: GroupButton<CpKey>[] = useMemo(
    () => [
      { value: "small", label: t("cpChangeSmall") },
      { value: "medium", label: t("cpChangeMedium") },
      { value: "large", label: t("cpChangeLarge") },
    ],
    [t]
  );

  // Newsletter state
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(
    isNewsletterSubscribed
  );
  const handleNewsletterChange = useCallback(
    async (checked: boolean) => {
      if (checked) {
        await subscribeToNewsletter(user.email);
      } else {
        await unsubscribeFromNewsletter();
      }
      setNewsletterSubscribed(checked);
    },
    [user.email]
  );
  const [updateNewsletter, isNewsletterPending] = useServerAction(
    handleNewsletterChange
  );

  // Metaculus News state
  const [newsSubscribed, setNewsSubscribed] = useState(
    user.metaculus_news_subscription
  );
  const handleNewsChange = useCallback(async (checked: boolean) => {
    setNewsSubscribed(checked);
    try {
      await updateProfileAction({ metaculus_news_subscription: checked });
    } catch (error) {
      setNewsSubscribed(!checked);
      throw error;
    }
  }, []);
  const [updateNews, isNewsPending] = useServerAction(handleNewsChange);

  // Mailing tag toggles
  const [loadingTag, setLoadingTag] = useState<SubscriptionEmailType | null>(
    null
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
        setLoadingTag(null);
      }
    },
    [user.unsubscribed_mailing_tags]
  );
  const [updateMailingTag, isMailingTagPending] = useServerAction(
    handleEmailSubscriptionChange
  );

  // Auto-follow state
  const [autoFollow, setAutoFollow] = useState(
    user.automatically_follow_on_predict
  );
  const handleAutoFollowChange = useCallback(async (checked: boolean) => {
    setAutoFollow(checked);
    try {
      await updateProfileAction({ automatically_follow_on_predict: checked });
    } catch (error) {
      setAutoFollow(!checked);
      throw error;
    }
  }, []);
  const [updateAutoFollow, isAutoFollowPending] = useServerAction(
    handleAutoFollowChange
  );

  // Default follow notification states
  const [cpThreshold, setCpThreshold] = useState(
    user.follow_notify_cp_change_threshold
  );
  const [commentsFreq, setCommentsFreq] = useState(
    user.follow_notify_comments_frequency
  );
  const [milestoneStep, setMilestoneStep] = useState(
    user.follow_notify_milestone_step
  );
  const [statusChange, setStatusChange] = useState(
    user.follow_notify_on_status_change
  );

  const [savingDefaultField, setSavingDefaultField] = useState<string | null>(
    null
  );
  const handleDefaultFollowUpdate = useCallback(
    async (
      updates: Parameters<typeof updateProfileAction>[0],
      rollback: () => void
    ) => {
      try {
        await updateProfileAction(updates);
      } catch (error) {
        rollback();
        throw error;
      }
    },
    []
  );
  const [runDefaultFollowUpdate, isDefaultFollowPending] = useServerAction(
    handleDefaultFollowUpdate
  );
  const updateDefaultFollow = useCallback(
    (
      field: string,
      updates: Parameters<typeof updateProfileAction>[0],
      rollback: () => void
    ) => {
      setSavingDefaultField(field);
      runDefaultFollowUpdate(updates, rollback);
    },
    [runDefaultFollowUpdate]
  );

  const keepingUpOptions: {
    type: SubscriptionEmailType;
    label: React.ReactNode;
  }[] = [
    {
      type: SubscriptionEmailType.comment_mentions,
      label: t("someoneAtMentionsMeInComment"),
    },
    {
      type: SubscriptionEmailType.question_resolution,
      label: t("questionIPredictedResolves"),
    },
    {
      type: SubscriptionEmailType.tournament_new_questions,
      label: t("newQuestionsInTournamentsIFollow"),
    },
    {
      type: SubscriptionEmailType.cp_change,
      label: (
        <>
          {t("cpChangeOnPredictedQuestions")}
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
      label: t.rich("myPredictionAboutToBeAutoWithdrawn", {
        link: (chunks) => (
          <Link
            href="/faq/#auto-withdrawal"
            className="text-blue-700 hover:underline dark:text-blue-700-dark"
          >
            {chunks}
          </Link>
        ),
      }),
    },
  ];

  return (
    <>
      {/* Site News */}
      <PreferencesSection title={t("siteNews")}>
        <div className="flex flex-col gap-3">
          <SwitchRow
            checked={newsletterSubscribed}
            onChange={updateNewsletter}
            isPending={isNewsletterPending}
            label={t("getTheMetaculusNewsletter")}
          />
          <SwitchRow
            checked={
              !user.unsubscribed_mailing_tags.includes(
                SubscriptionEmailType.weekly_top_comments
              )
            }
            onChange={(checked) => {
              setLoadingTag(SubscriptionEmailType.weekly_top_comments);
              updateMailingTag(
                SubscriptionEmailType.weekly_top_comments,
                checked
              );
            }}
            isPending={
              isMailingTagPending &&
              loadingTag === SubscriptionEmailType.weekly_top_comments
            }
            label={t.rich("getWeeklyTopCommentsEmails", {
              link: (chunks) => (
                <Link
                  href="/questions/?weekly_top_comments=true"
                  className="text-blue-700 hover:underline dark:text-blue-700-dark"
                >
                  {chunks}
                </Link>
              ),
            })}
          />
          <SwitchRow
            checked={newsSubscribed}
            onChange={updateNews}
            isPending={isNewsPending}
            label={t.rich("followMetaculusNewsPosts", {
              link: (chunks) => (
                <Link
                  href="/news/"
                  className="text-blue-700 hover:underline dark:text-blue-700-dark"
                >
                  {chunks}
                </Link>
              ),
            })}
          />
        </div>
      </PreferencesSection>

      {/* Keeping Up */}
      <PreferencesSection title={t("keepingUp")}>
        <div className="flex flex-col gap-3">
          <span className="text-sm">{t("receiveEmailNotificationsWhen")}</span>
          {keepingUpOptions.map(({ type, label }) => (
            <SwitchRow
              key={`keeping-up-${type}`}
              checked={!user.unsubscribed_mailing_tags.includes(type)}
              onChange={(checked) => {
                setLoadingTag(type);
                updateMailingTag(type, checked);
              }}
              isPending={isMailingTagPending && loadingTag === type}
              label={label}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <span className="text-sm font-bold">{t("autoFollow")}</span>
          <SwitchRow
            checked={autoFollow}
            onChange={updateAutoFollow}
            isPending={isAutoFollowPending}
            label={t("autoFollowOnPredict")}
            description={t("autoFollowOnPredictHint")}
          />
        </div>
      </PreferencesSection>

      {/* Default Follow Notifications */}
      <PreferencesSection title={t("defaultFollowNotifications")}>
        <span className="text-sm">
          {t("defaultFollowNotificationsDescription")}
        </span>
        <div className="flex flex-col gap-3">
          <SwitchRow
            checked={cpThreshold !== null}
            onChange={(checked) => {
              const value = checked ? CPChangeThreshold.MEDIUM : null;
              const prevValue = cpThreshold;
              setCpThreshold(value);
              updateDefaultFollow(
                "cp",
                { follow_notify_cp_change_threshold: value },
                () => setCpThreshold(prevValue)
              );
            }}
            isPending={isDefaultFollowPending && savingDefaultField === "cp"}
            label={t("followModalCommunityPredictionChanges")}
          />
          {cpThreshold !== null && (
            <div className="space-y-1 pl-[60px]">
              <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                {t.rich("defaultFollowCpChangeSentence", {
                  options: () => (
                    <ButtonGroup
                      value={cpValueToKey(cpThreshold)}
                      buttons={cpButtons}
                      disabled={isDefaultFollowPending}
                      onChange={(k) => {
                        const value = cpKeyToValue(k);
                        const prevValue = cpThreshold;
                        setCpThreshold(value);
                        updateDefaultFollow(
                          "cp",
                          { follow_notify_cp_change_threshold: value },
                          () => setCpThreshold(prevValue)
                        );
                      }}
                      variant="secondary"
                      activeVariant="primary"
                      className="px-2 py-1 text-xs"
                      activeClassName="px-2 py-1 text-xs"
                    />
                  ),
                })}
              </div>
              <ul className="list-disc pl-[14px] text-xs opacity-70">
                <li>
                  {t("followModalSmallChanges")} (45% &rarr; 55% / 90% &rarr;
                  95%)
                </li>
                <li>
                  {t("followModalMediumChanges")} (40% &rarr; 60% / 90% &rarr;
                  98%)
                </li>
                <li>
                  {t("followModalLargeChanges")} (35% &rarr; 65% / 90% &rarr;
                  99.8%)
                </li>
              </ul>
            </div>
          )}
          <SwitchRow
            checked={commentsFreq !== null}
            onChange={(checked) => {
              const value = checked ? 10 : null;
              const prevValue = commentsFreq;
              setCommentsFreq(value);
              updateDefaultFollow(
                "comments",
                { follow_notify_comments_frequency: value },
                () => setCommentsFreq(prevValue)
              );
            }}
            isPending={
              isDefaultFollowPending && savingDefaultField === "comments"
            }
            label={t("comments")}
          />
          {commentsFreq !== null && (
            <div className="flex items-center gap-2 pl-[60px] text-xs opacity-70">
              {t.rich("defaultFollowCommentsSentence", {
                options: () => (
                  <ButtonGroup
                    value={String(commentsFreq) as "1" | "3" | "10"}
                    buttons={COMMENTS_BUTTONS}
                    disabled={isDefaultFollowPending}
                    onChange={(v) => {
                      const value = Number(v);
                      const prevValue = commentsFreq;
                      setCommentsFreq(value);
                      updateDefaultFollow(
                        "comments",
                        { follow_notify_comments_frequency: value },
                        () => setCommentsFreq(prevValue)
                      );
                    }}
                    variant="secondary"
                    activeVariant="primary"
                    className="px-2 py-1 text-xs"
                    activeClassName="px-2 py-1 text-xs"
                  />
                ),
              })}
            </div>
          )}
          <SwitchRow
            checked={milestoneStep !== null}
            onChange={(checked) => {
              const value = checked ? 0.2 : null;
              const prevValue = milestoneStep;
              setMilestoneStep(value);
              updateDefaultFollow(
                "milestone",
                { follow_notify_milestone_step: value },
                () => setMilestoneStep(prevValue)
              );
            }}
            isPending={
              isDefaultFollowPending && savingDefaultField === "milestone"
            }
            label={t("followModalMilestones")}
          />
          {milestoneStep !== null && (
            <div className="flex flex-wrap items-center gap-2 pl-[60px] text-xs opacity-70">
              {t.rich("defaultFollowMilestoneSentence", {
                options: () => (
                  <ButtonGroup
                    value={
                      String(milestoneStep * 100) as "1" | "5" | "10" | "20"
                    }
                    buttons={MILESTONE_BUTTONS}
                    disabled={isDefaultFollowPending}
                    onChange={(v) => {
                      const value = Number(v) / 100;
                      const prevValue = milestoneStep;
                      setMilestoneStep(value);
                      updateDefaultFollow(
                        "milestone",
                        { follow_notify_milestone_step: value },
                        () => setMilestoneStep(prevValue)
                      );
                    }}
                    variant="secondary"
                    activeVariant="primary"
                    className="px-2 py-1 text-xs"
                    activeClassName="px-2 py-1 text-xs"
                  />
                ),
              })}
            </div>
          )}
          <SwitchRow
            checked={statusChange}
            onChange={(checked) => {
              const prevValue = statusChange;
              setStatusChange(checked);
              updateDefaultFollow(
                "status",
                { follow_notify_on_status_change: checked },
                () => setStatusChange(prevValue)
              );
            }}
            isPending={
              isDefaultFollowPending && savingDefaultField === "status"
            }
            label={t("followModalStatusChanges")}
          />
        </div>
      </PreferencesSection>
    </>
  );
};

const SwitchRow: FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  isPending: boolean;
  label: React.ReactNode;
  description?: string;
}> = ({ checked, onChange, isPending, label, description }) => {
  const [showSaved, setShowSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      wasPending.current = true;
    } else if (wasPending.current) {
      wasPending.current = false;
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  const statusIcon = isPending ? (
    <LoadingSpinner size="1x" />
  ) : showSaved ? (
    <FontAwesomeIcon
      icon={faCheck}
      className="text-olive-700 dark:text-olive-700-dark"
    />
  ) : null;

  return (
    <div
      className={`flex gap-4 ${description ? "items-start" : "items-center"}`}
    >
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={isPending}
        className={`shrink-0 ${description ? "mt-0.5" : ""}`}
      />
      {description ? (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm">{label}</span>
            {statusIcon}
          </div>
          <span className="text-xs opacity-70">{description}</span>
        </div>
      ) : (
        <>
          <span className="text-sm">{label}</span>
          {statusIcon}
        </>
      )}
    </div>
  );
};

export default EmailNotifications;
