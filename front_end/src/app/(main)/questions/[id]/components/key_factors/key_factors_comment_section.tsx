import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item";
import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import useScrollTo from "@/hooks/use_scroll_to";
import { CommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";

type Props = {
  keyFactors: KeyFactor[];
  comment: CommentType;
  post: PostWithForecasts;
};

const KeyFactorsCommentSection: FC<Props> = ({ post, keyFactors }) => {
  const t = useTranslations();
  const scrollTo = useScrollTo();

  return (
    <div className="flex flex-col">
      <div className="mb-3.5 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
      </div>

      <KeyFactorsCarousel
        items={keyFactors}
        renderItem={(kf) => (
          <Link
            href="#key-factors"
            className="no-underline"
            onClick={() => {
              const target = document.getElementById("key-factors");
              if (target) {
                scrollTo(target.getBoundingClientRect().top);
              }
              sendAnalyticsEvent("KeyFactorClick", {
                event_label: "fromComment",
              });
            }}
          >
            <KeyFactorItem
              keyFactor={kf}
              post={post}
              isCompact={true}
              mode={"consumer"}
            />
          </Link>
        )}
      />
    </div>
  );
};

export default KeyFactorsCommentSection;
