"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item";
import ReusableGradientCarousel from "@/components/gradient-carousel";
import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

type Props = {
  keyFactors: KeyFactor[];
  post: PostWithForecasts;
};

const KeyFactorsConsumerSection: FC<Props> = ({ post, keyFactors }) => {
  const t = useTranslations();

  return (
    <div className="mt-8 flex flex-col" id="key-factors">
      <div className="mb-4 text-sm text-blue-800 dark:text-blue-800-dark">
        {t("topKeyFactors")}
      </div>

      <ReusableGradientCarousel<(typeof keyFactors)[number]>
        wheelToHorizontal={false}
        items={keyFactors}
        itemClassName=""
        gapClassName="gap-2.5"
        listClassName="px-0"
        gradientFromClass="from-gray-0 dark:from-gray-0-dark"
        renderItem={(kf) => (
          <KeyFactorItem
            keyFactor={kf}
            post={post}
            mode={"consumer"}
            className="max-w-[200px]"
          />
        )}
      />
    </div>
  );
};

export default KeyFactorsConsumerSection;
