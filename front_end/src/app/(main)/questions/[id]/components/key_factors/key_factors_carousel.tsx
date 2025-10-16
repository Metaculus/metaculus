import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item";
import ReusableGradientCarousel from "@/components/gradient-carousel";
import { CommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

type Props = {
  keyFactors: KeyFactor[];
  comment: CommentType;
  post: PostWithForecasts;
};

const KeyFactorsCarousel: FC<Props> = ({ post, comment, keyFactors }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col">
      <div className="mb-3.5 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
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
            isCompact={true}
            mode={"consumer"}
          />
        )}
      />
    </div>
  );
};

export default KeyFactorsCarousel;
