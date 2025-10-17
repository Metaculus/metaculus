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
    <div
      className="-ml-4 mt-8 flex w-[calc(100%+32px)] flex-col sm:ml-0 sm:w-full"
      id="key-factors"
    >
      <div className="mb-4 pl-4 text-sm text-blue-800 dark:text-blue-800-dark sm:pl-0">
        {t("topKeyFactors")}
      </div>

      <KeyFactorsCarousel
        listClassName="[&>:first-child]:pl-4 [&>:last-child]:pr-4 sm:[&>:first-child]:pl-0 sm:[&>:last-child]:pr-0"
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
