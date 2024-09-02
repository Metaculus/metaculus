"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { PostSubscriptionType, PostWithSubscriptions } from "@/types/post";
import { CurrentUser } from "@/types/users";
import { formatDate } from "@/utils/date_formatters";

export type Props = {
  user: CurrentUser;
  subscriptions: PostWithSubscriptions[];
};

const getSubscriptionsLabel = (
  t: ReturnType<typeof useTranslations>,
  locale: ReturnType<typeof useLocale>,
  postWithSubscriptions: PostWithSubscriptions
) => {
  if (postWithSubscriptions.subscriptions.length === 1) {
    const sub = postWithSubscriptions.subscriptions[0];

    switch (sub.type) {
      case PostSubscriptionType.STATUS_CHANGE:
        return t("followModalStatusChanges");
      case PostSubscriptionType.CP_CHANGE:
        return `${t("followModalCommunityPredictionChanges")} ${sub.cp_change_threshold * 100}%`;
      case PostSubscriptionType.MILESTONE:
        return t("followModalMilestonesNotifyEvery", {
          pct: `${sub.milestone_step * 100}%`,
        });
      case PostSubscriptionType.NEW_COMMENTS:
        return t("followModalEveryNComments", { n: sub.comments_frequency });
      case PostSubscriptionType.SPECIFIC_TIME:
        return t("onDate", {
          date: formatDate(locale, new Date(sub.next_trigger_datetime)),
        });
    }
  }

  return t("nTriggers", {
    n: postWithSubscriptions.subscriptions.length,
  });
};

const QuestionNotifications: FC<Props> = ({ user, subscriptions }) => {
  const t = useTranslations();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<{
    type: "deletion" | "edition";
    post: PostWithSubscriptions;
  }>();

  const handleUnfollow = useCallback(async () => {
    setIsLoading(true);
    try {
      await changePostSubscriptions(activeModal!.post.id, []);
    } finally {
      setIsLoading(false);
    }

    setActiveModal(undefined);
  }, [activeModal]);

  return (
    <section className="text-sm">
      <hr />
      <h2 className="mb-5 mt-3 px-1">{t("settingsQuestionNotifications")}</h2>
      <div className="p-1 text-sm">
        <table className="table-auto rounded-lg">
          <thead className="text-left text-blue-700">
            <tr>
              <th className="border border-gray-300 bg-blue-200 p-2 font-normal">
                {t("question")}
              </th>
              <th className="border border-gray-300 bg-blue-200 p-2 font-normal">
                {t("remindWhen")}
              </th>
              <th className="border border-gray-300 bg-blue-200 p-2 font-normal">
                {t("created")}
              </th>
              <th className="border border-gray-300 bg-blue-200 p-2 font-normal"></th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {subscriptions.map((obj, index) => (
              <tr
                key={`post-${obj.id}`}
                className={classNames({
                  "rounded-b": index === subscriptions.length - 1,
                })}
              >
                <td className="rounded-l border border-gray-300 p-2">
                  <Link className="text-blue-800" href={`/questions/${obj.id}`}>
                    {obj.title}
                  </Link>
                </td>
                <td className="border border-gray-300 p-2">
                  {getSubscriptionsLabel(t, locale, obj)}
                </td>
                <td className="rounded-r border border-gray-300 p-2">
                  {formatDate(
                    locale,
                    new Date(obj.subscriptions.at(-1)!.created_at)
                  )}
                </td>
                <td className="rounded-r border border-gray-300 p-2">
                  <button
                    className="p-1 text-xl text-gray-500 no-underline hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-blue-800-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
                    onClick={() =>
                      setActiveModal({
                        type: "deletion",
                        post: obj,
                      })
                    }
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BaseModal
        label={t("unfollowModalTitle")}
        isOpen={activeModal?.type === "deletion"}
        onClose={() => setActiveModal(undefined)}
      >
        <div className="max-w-xl">
          <p className="text-base leading-tight">
            {t("unfollowModalDescription")}
          </p>
          <div className="flex w-full justify-end">
            <div className="flex w-fit gap-2">
              <Button
                variant="primary"
                disabled={isLoading}
                onClick={() => handleUnfollow()}
              >
                {t("followModalUnfollowButton")}
              </Button>
            </div>
          </div>
        </div>
      </BaseModal>
    </section>
  );
};

export default QuestionNotifications;
