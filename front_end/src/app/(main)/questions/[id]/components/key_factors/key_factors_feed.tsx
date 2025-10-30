"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { AddKeyFactorsButton } from "@/app/(main)/questions/[id]/components/key_factors/add_button";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import KeyFactorItem from "./key_factor_item";

type Props = {
  post: PostWithForecasts;
  keyFactorItemClassName?: string;
  mobileOnly?: boolean;
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
  // Randomize only on initial load
  const [randomizedKeyFactors, setRandomizedKeyFactors] = useState<
    typeof combinedKeyFactors
  >(() =>
    [...combinedKeyFactors].sort((a, b) => {
      const sortKeyA = Math.random() / (a.freshness + 1);
      const sortKeyB = Math.random() / (b.freshness + 1);
      return sortKeyA - sortKeyB;
    })
  );

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentIds = new Set(combinedKeyFactors.map((kf) => kf.id));
    const updated = randomizedKeyFactors.filter((kf) => currentIds.has(kf.id));

    // Append any new key factors not already present
    const existingIds = new Set(updated.map((kf) => kf.id));
    const newItems = combinedKeyFactors.filter((kf) => !existingIds.has(kf.id));

    if (newItems.length || updated.length !== randomizedKeyFactors.length) {
      setRandomizedKeyFactors([...updated, ...newItems]);
    }
  }, [combinedKeyFactors, randomizedKeyFactors]);

  if (combinedKeyFactors.length === 0) {
    return <KeyFactorsEmpty post={post} />;
  }

  return (
    <div className="flex flex-col gap-2.5" id="key-factors">
      {randomizedKeyFactors.map((kf) => (
        <KeyFactorItem
          id={`key-factor-${kf.id}`}
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
