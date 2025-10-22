"use client";

import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

import KeyFactorItem from "./key_factor_item";
import { useKeyFactorsContext } from "./key_factors_provider";

type Props = {
  post: PostWithForecasts;
  kfClassName?: string;
};

const KeyFactorsEmpty: FC = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { setIsAddModalOpen } = useKeyFactorsContext();

  return (
    <div className="flex flex-col items-center justify-between pb-8 pt-6">
      <span>{t("noKeyFactorsP1")}</span>
      <span className="mt-1 text-sm text-blue-600 dark:text-blue-600-dark">
        {t("noKeyFactorsP2")}
      </span>
      {/* Reuse the modal from within content for empty state */}
      <button
        className="mx-auto mt-4 cursor-pointer gap-2 px-3 py-1 text-sm capitalize text-blue-700 hover:underline"
        onClick={(event) => {
          event.preventDefault();
          if (!user) {
            setCurrentModal({ type: "signin" });
            return;
          }
          setIsAddModalOpen(true);
        }}
      >
        {t("addKeyFactor")}
      </button>
    </div>
  );
};

const KeyFactorsFeed: FC<Props> = ({ post, kfClassName }) => {
  const { combinedKeyFactors } = useCommentsFeed();

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  if (combinedKeyFactors.length === 0) {
    return <KeyFactorsEmpty />;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {combinedKeyFactors.map((kf) => (
        <KeyFactorItem
          key={`post-key-factor-${kf.id}`}
          keyFactor={kf}
          post={post}
          className={kfClassName}
        />
      ))}
    </div>
  );
};

export default KeyFactorsFeed;
