"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useState, useMemo } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import AddKeyFactorsModal from "@/app/(main)/questions/[id]/components/key_factors/add_key_factors_modal";
import Button from "@/components/ui/button";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import useHash from "@/hooks/use_hash";
import { PostStatus } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/cn";

import KeyFactorItem from "./key_factor_item";

type KeyFactorsSectionProps = {
  postId: number;
  postStatus: PostStatus;
};

const AddKeyFactorsButton: FC<{
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}> = ({ onClick, className }) => {
  const t = useTranslations();
  return (
    <Button
      as="div"
      className={cn(
        "cursor-pointer gap-2 px-3 py-1 text-sm capitalize",
        className
      )}
      size="xs"
      variant="tertiary"
      onClick={(e) => onClick(e as React.MouseEvent<HTMLButtonElement>)}
    >
      <FontAwesomeIcon icon={faPlus} className="size-4 p-0" />
      {t("addKeyFactor")}
    </Button>
  );
};

const KeyFactorsSection: FC<KeyFactorsSectionProps> = ({
  postId,
  postStatus,
}) => {
  const t = useTranslations();
  const hash = useHash();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const [displayLimit, setDisplayLimit] = useState(4);
  const [isAddKeyFactorsModalOpen, setIsAddKeyFactorsModalOpen] =
    useState(false);

  const { combinedKeyFactors } = useCommentsFeed();

  useEffect(() => {
    // Expands the key factor list when you follow the #key-factors link.
    if (hash === "key-factors") setDisplayLimit(combinedKeyFactors.length);
  }, [hash, combinedKeyFactors.length]);

  useEffect(() => {
    if (combinedKeyFactors.length > 0) {
      sendAnalyticsEvent("KeyFactorPageview");
    }
  }, [combinedKeyFactors]);

  const visibleKeyFactors = useMemo(
    () => combinedKeyFactors.slice(0, displayLimit),
    [combinedKeyFactors, displayLimit]
  );

  if (
    [
      PostStatus.CLOSED,
      PostStatus.RESOLVED,
      PostStatus.PENDING_RESOLUTION,
    ].includes(postStatus) &&
    combinedKeyFactors.length === 0
  ) {
    return null;
  }

  return (
    <>
      {user && (
        <AddKeyFactorsModal
          isOpen={isAddKeyFactorsModalOpen}
          onClose={() => setIsAddKeyFactorsModalOpen(false)}
          postId={postId}
          user={user}
        />
      )}

      <SectionToggle
        detailElement={
          combinedKeyFactors.length > 0 &&
          ![
            PostStatus.CLOSED,
            PostStatus.RESOLVED,
            PostStatus.PENDING_RESOLUTION,
          ].includes(postStatus) ? (
            <AddKeyFactorsButton
              className="ml-auto"
              onClick={(event) => {
                event.preventDefault();
                if (!user) {
                  setCurrentModal({ type: "signin" });
                  return;
                }
                setIsAddKeyFactorsModalOpen(true);
              }}
            />
          ) : null
        }
        title={t("keyFactors")}
        defaultOpen
        id="key-factors"
        wrapperClassName="scroll-mt-header"
      >
        {combinedKeyFactors.length > 0 ? (
          <div id="key-factors-list" className="flex flex-col gap-2.5">
            {visibleKeyFactors.map((kf) => (
              <KeyFactorItem key={`post-key-factor-${kf.id}`} keyFactor={kf} />
            ))}
            {combinedKeyFactors.length > displayLimit && (
              <div className="flex flex-col items-center justify-between hover:text-blue-700 @md:flex-row">
                <Button
                  variant="tertiary"
                  onClick={() => setDisplayLimit((prev) => prev + 10)}
                >
                  {t("showMore")}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between pb-8 pt-6">
            <span>{t("noKeyFactorsP1")}</span>
            <span className="mt-1 text-sm text-blue-600 dark:text-blue-600-dark">
              {t("noKeyFactorsP2")}
            </span>
            <AddKeyFactorsButton
              className="mx-auto mt-4"
              onClick={(event) => {
                event.preventDefault();
                if (!user) {
                  setCurrentModal({ type: "signin" });
                  return;
                }
                setIsAddKeyFactorsModalOpen(true);
              }}
            />
          </div>
        )}
      </SectionToggle>
    </>
  );
};

export default KeyFactorsSection;
