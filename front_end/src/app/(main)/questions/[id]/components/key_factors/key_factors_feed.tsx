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
  const [order, setOrder] = useState<number[] | null>(null);

  useEffect(() => {
    if (!order && combinedKeyFactors.length) {
      const randomizedIds = [...combinedKeyFactors]
        .sort(
          (a, b) =>
            Math.random() / (a.freshness + 1) -
            Math.random() / (b.freshness + 1)
        )
        .map((kf) => kf.id);
      setOrder(randomizedIds);
    }
  }, [order, combinedKeyFactors]);

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!order) return;
    const existing = new Set(order);
    const newIds = combinedKeyFactors
      .map((kf) => kf.id)
      .filter((id) => !existing.has(id));
    if (newIds.length) setOrder([...order, ...newIds]);
  }, [order, combinedKeyFactors]);

  const items = (order ?? combinedKeyFactors.map((kf) => kf.id))
    .map((id) => combinedKeyFactors.find((kf) => kf.id === id))
    .filter(Boolean) as typeof combinedKeyFactors;

  if (combinedKeyFactors.length === 0) {
    return <KeyFactorsEmpty post={post} />;
  }

  return (
    <div className="flex flex-col gap-2.5" id="key-factors">
      {items.map((kf) => (
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
