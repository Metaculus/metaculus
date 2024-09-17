"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";

import { changePostSubscriptions } from "@/app/(main)/questions/actions";
import BaseModal from "@/components/base_modal";
import PostSubscribeCustomizeModal from "@/components/post_subscribe/post_subscribe_customise_modal";
import Button from "@/components/ui/button";
import { Post, PostSubscriptionType } from "@/types/post";
import { CurrentUser } from "@/types/users";
import { Require } from "@/types/utils";
import { formatDate } from "@/utils/date_formatters";

type PostWithSubscriptions = Require<Post, "subscriptions">;
type Props = {
  user: CurrentUser;
  posts: PostWithSubscriptions[];
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

const QuestionNotifications: FC<Props> = ({ user, posts }) => {
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
      await changePostSubscriptions(activeModal!.post.id, [], true);
    } finally {
      setIsLoading(false);
    }

    setActiveModal(undefined);
  }, [activeModal]);

  return (
    <section className="text-sm">
      <hr />
      <h2 className="mb-5 mt-3 px-1">{t("settingsQuestionNotifications")}</h2>
      <div className="p-1">
        <table className="hidden w-full table-auto border-separate rounded-lg lg:table">
          <thead className="text-left text-blue-700 dark:text-blue-700-dark">
            <tr>
              <th className="rounded-tl border border-b-0 border-gray-300 bg-blue-200 p-2 font-normal dark:border-gray-300-dark dark:bg-blue-200-dark">
                {t("question")}
              </th>
              <th className="border border-b-0 border-gray-300 bg-blue-200 p-2 font-normal dark:border-gray-300-dark dark:bg-blue-200-dark">
                {t("remindWhen")}
              </th>
              <th className="border border-b-0 border-gray-300 bg-blue-200 p-2 font-normal dark:border-gray-300-dark dark:bg-blue-200-dark">
                {t("created")}
              </th>
              <th className="rounded-tr border border-b-0 border-gray-300 bg-blue-200 p-2 font-normal dark:border-gray-300-dark dark:bg-blue-200-dark"></th>
            </tr>
          </thead>
          <tbody className="text-gray-800 dark:text-gray-800-dark">
            {posts.map((post, index) => (
              <tr
                key={`sub-${post.id}`}
                className={classNames({
                  "rounded-b": index === posts.length - 1,
                })}
              >
                <td
                  className={classNames(
                    "max-w-[500px] border border-blue-200 border-l-gray-300 p-2 dark:border-blue-200-dark dark:border-l-gray-300-dark",
                    {
                      "rounded-bl border-b-gray-300 dark:border-b-gray-300-dark":
                        index === posts.length - 1,
                    }
                  )}
                >
                  <Button
                    variant="link"
                    className="text-left text-blue-800"
                    onClick={() => setActiveModal({ type: "edition", post })}
                  >
                    {post.title}
                  </Button>
                </td>
                <td
                  className={classNames(
                    "border border-blue-200 p-2 dark:border-blue-200-dark",
                    {
                      "border-b-gray-300 dark:border-b-gray-300-dark":
                        index === posts.length - 1,
                    }
                  )}
                >
                  {getSubscriptionsLabel(t, locale, post)}
                </td>
                <td
                  className={classNames(
                    "border border-blue-200 p-2 dark:border-blue-200-dark",
                    {
                      "border-b-gray-300 dark:border-b-gray-300-dark":
                        index === posts.length - 1,
                    }
                  )}
                >
                  {formatDate(
                    locale,
                    new Date(post.subscriptions.at(-1)!.created_at)
                  )}
                </td>
                <td
                  className={classNames(
                    "border border-blue-200 border-r-gray-300 p-2 dark:border-blue-200-dark dark:border-r-gray-300-dark",
                    {
                      "rounded-br border-b-gray-300 dark:border-b-gray-300-dark":
                        index === posts.length - 1,
                    }
                  )}
                >
                  <button
                    className="p-1 text-xl text-gray-500 no-underline hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-gray-500-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
                    onClick={() =>
                      setActiveModal({
                        type: "deletion",
                        post,
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
        <div className="flex flex-col gap-2.5 lg:hidden">
          {posts.map((post) => (
            <div
              key={`sub-mobile-${post.id}`}
              className="flex flex-col gap-2 rounded border border-blue-400 bg-blue-200 px-4 py-3 text-gray-800 dark:border-blue-400-dark dark:bg-blue-200-dark dark:text-gray-800-dark"
            >
              <div className="flex items-baseline justify-between gap-3">
                <Button
                  variant="link"
                  className="text-left text-blue-800 dark:text-blue-800-dark"
                  size="md"
                  onClick={() => setActiveModal({ type: "edition", post })}
                >
                  {post.title}
                </Button>
                <button
                  className="p-1 text-xl text-gray-500 no-underline hover:text-blue-900 active:text-blue-700 disabled:text-blue-800 disabled:opacity-30 dark:text-gray-500-dark dark:hover:text-blue-900-dark dark:active:text-blue-700-dark dark:disabled:text-blue-800-dark"
                  onClick={() =>
                    setActiveModal({
                      type: "deletion",
                      post,
                    })
                  }
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className="grid grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-gray-500 dark:text-gray-500-dark">
                    {t("remindWhen")}
                  </div>
                  <div>{getSubscriptionsLabel(t, locale, post)}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-gray-500 dark:text-gray-500-dark">
                    {t("created")}
                  </div>
                  <div>
                    {formatDate(
                      locale,
                      new Date(post.subscriptions.at(-1)!.created_at)
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
      {activeModal && (
        <PostSubscribeCustomizeModal
          isOpen={activeModal.type === "edition"}
          onClose={() => setActiveModal(undefined)}
          post={activeModal.post}
          subscriptions={activeModal.post.subscriptions}
          showPostLink={true}
        />
      )}
    </section>
  );
};

export default QuestionNotifications;
