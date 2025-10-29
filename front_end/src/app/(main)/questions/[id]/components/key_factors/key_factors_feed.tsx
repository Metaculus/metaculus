"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { AddKeyFactorsButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import KeyFactorItem from "./key_factor_item";

type Props = {
  post: PostWithForecasts;
  keyFactorItemClassName?: string;
};

const KeyFactorsEmpty: FC<{ post: PostWithForecasts }> = ({ post }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center justify-between pb-8 pt-6">
      <span>{t("noKeyFactorsP1")}</span>
      <span className="mt-1 text-sm text-blue-600 dark:text-blue-600-dark">
        {t("noKeyFactorsP2")}
      </span>
      <AddKeyFactorsButton className="mx-auto mt-4" post={post} />
    </div>
  );
};

const KeyFactorsFeed: FC<Props> = ({ post, keyFactorItemClassName }) => {
  const { combinedKeyFactors } = useCommentsFeed();

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  if (combinedKeyFactors.length === 0) {
    return <KeyFactorsEmpty post={post} />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {combinedKeyFactors.map((kf) => (
        <KeyFactorItem
          key={`post-key-factor-${kf.id}`}
          keyFactor={kf}
          projectPermission={post.user_permission}
          className={keyFactorItemClassName}
        />
      ))}
    </div>
  );
};

export default KeyFactorsFeed;
