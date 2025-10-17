"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import { KeyFactorItem } from "./key_factor_item";
import KeyFactorsCarousel from "./key_factors_carousel";

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

      <KeyFactorsCarousel
        items={keyFactors}
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
