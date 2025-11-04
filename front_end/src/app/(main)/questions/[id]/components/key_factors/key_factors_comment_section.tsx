import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useKeyFactorDelete } from "@/app/(main)/questions/[id]/components/key_factors/hooks";
import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/item_view";
import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import { openKeyFactorsSectionAndScrollTo } from "@/app/(main)/questions/[id]/components/key_factors/utils";
import { useQuestionLayoutSafe } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import { useAuth } from "@/contexts/auth_context";
import { KeyFactor } from "@/types/comment";
import { Post, ProjectPermissions } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";

type Props = {
  keyFactors: KeyFactor[];
  permission?: ProjectPermissions;
  post: Post;
  authorId: number;
};

const KeyFactorsCommentSection: FC<Props> = ({
  post,
  keyFactors,
  permission,
  authorId,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const questionLayout = useQuestionLayoutSafe();
  const { openDeleteModal } = useKeyFactorDelete();

  const canEdit =
    user?.id === authorId || permission === ProjectPermissions.ADMIN;

  const kfPostUrl = `${getPostLink(post)}#key-factors`;

  // Don't render if there are no key factors for this comment
  if (keyFactors.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="mb-3.5 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("keyFactors")}
      </div>

      <KeyFactorsCarousel
        items={keyFactors}
        className="-mt-3"
        renderItem={(kf) => {
          const handleClick = () => {
            questionLayout?.requestKeyFactorsExpand?.();

            openKeyFactorsSectionAndScrollTo({
              selector: `[id="key-factor-${kf.id}"]`,
              mobileOnly: false,
            });

            sendAnalyticsEvent("KeyFactorClick", {
              event_label: "fromComment",
            });
          };

          return (
            <div className="group relative mt-3">
              <div
                className={cn("no-underline", "cursor-pointer")}
                onClick={handleClick}
                data-href={kfPostUrl}
              >
                <KeyFactorItem
                  keyFactor={kf}
                  isCompact={true}
                  mode="consumer"
                />
              </div>

              {canEdit && (
                <div className="absolute -right-3 -top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    className="pointer-events-auto flex h-6 w-6 rounded-full bg-salmon-300 p-0 text-salmon-600 dark:bg-salmon-300-dark dark:text-salmon-600-dark"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDeleteModal(kf.id);
                    }}
                  >
                    <FontAwesomeIcon icon={faClose} className="m-auto size-4" />
                  </button>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default KeyFactorsCommentSection;
