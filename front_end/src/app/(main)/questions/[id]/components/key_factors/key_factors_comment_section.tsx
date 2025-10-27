import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { KeyFactorItem } from "@/app/(main)/questions/[id]/components/key_factors/key_factor_item";
import KeyFactorsCarousel from "@/app/(main)/questions/[id]/components/key_factors/key_factors_carousel";
import { deleteKeyFactor as deleteKeyFactorAction } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import useScrollTo from "@/hooks/use_scroll_to";
import { CommentType } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import { KeyFactor } from "@/types/comment";
import { Post } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getPostLink } from "@/utils/navigation";

import { useKeyFactorsContext } from "./key_factors_provider";

type Props = {
  comment: CommentType;
  permission?: ProjectPermissions;
  post: Post;
};

const KeyFactorsCommentSection: FC<Props> = ({ post, comment, permission }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const scrollTo = useScrollTo();
  const { requestExpand } = useKeyFactorsContext();
  const { setCurrentModal } = useModal();
  const { combinedKeyFactors, setCombinedKeyFactors } = useCommentsFeed();

  // Derive keyFactors from combinedKeyFactors instead of receiving as prop
  const keyFactors = useMemo(
    () => combinedKeyFactors.filter((kf) => kf.comment_id === comment.id),
    [combinedKeyFactors, comment.id]
  );

  const canEdit =
    user?.id === comment.author.id || permission === ProjectPermissions.ADMIN;

  const kfPostUrl = `${getPostLink(post)}#key-factors`;

  const handleDelete = useCallback(
    async (keyFactorId: number) => {
      setCurrentModal({
        type: "confirm",
        data: {
          title: t("confirmDeletion"),
          description: t("confirmDeletionKeyFactorDescription"),
          onConfirm: async () => {
            const result = await deleteKeyFactorAction(keyFactorId);

            if (!result || !("errors" in result)) {
              setCombinedKeyFactors(
                combinedKeyFactors.filter((kf) => kf.id !== keyFactorId)
              );
            }
          },
        },
      });
    },
    [setCurrentModal, t, combinedKeyFactors, setCombinedKeyFactors]
  );

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
        renderItem={(kf) => (
          <div className="group relative mt-3">
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
              <KeyFactorItem
                keyFactor={kf}
                isCompact={true}
                mode={"consumer"}
              />
            </Link>
            {canEdit && (
              <div className="absolute -right-3 -top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  className="pointer-events-auto flex h-6 w-6 rounded-full bg-salmon-300 p-0 text-salmon-600 dark:bg-salmon-300-dark dark:text-salmon-600-dark"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(kf.id);
                  }}
                >
                  <FontAwesomeIcon icon={faClose} className="m-auto size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default KeyFactorsCommentSection;
