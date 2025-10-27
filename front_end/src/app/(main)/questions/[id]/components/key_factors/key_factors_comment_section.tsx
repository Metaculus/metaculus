import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item";
import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import useScrollTo from "@/hooks/use_scroll_to";
import { KeyFactor } from "@/types/comment";
import { Post } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getPostLink } from "@/utils/navigation";

import { useKeyFactorsContext } from "./key_factors_provider";

type Props = {
  keyFactors: KeyFactor[];
  post: Post;
};

const KeyFactorsCommentSection: FC<Props> = ({ keyFactors, post }) => {
  const t = useTranslations();
  const scrollTo = useScrollTo();
  const { requestExpand } = useKeyFactorsContext();
  const kfPostUrl = `${getPostLink(post)}#key-factors`;

  return (
    <div className="flex flex-col">
      <div className="mb-3.5 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
      </div>

      <KeyFactorsCarousel
        items={keyFactors}
        renderItem={(kf) => (
          <Link
            href={kfPostUrl}
            className="no-underline"
            onClick={(e) => {
              const target = document.getElementById("key-factors");
              if (!target) return;

              e.preventDefault();
              // Expand immediately to avoid post-scroll delay
              requestExpand();
              scrollTo(target.getBoundingClientRect().top);
              sendAnalyticsEvent("KeyFactorClick", {
                event_label: "fromComment",
              });
            }}
          >
            <KeyFactorItem keyFactor={kf} isCompact={true} mode={"consumer"} />
          </Link>
        )}
      />
    </div>
  );
};

export default KeyFactorsCommentSection;
