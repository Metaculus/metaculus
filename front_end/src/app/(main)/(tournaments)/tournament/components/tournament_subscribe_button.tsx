"use client";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import {
  subscribeProject,
  unsubscribeProject,
} from "@/app/(main)/(tournaments)/tournament/[slug]/actions";
import TournamentSubscribeModal from "@/app/(main)/(tournaments)/tournament/components/tournament_subscribe_modal";
import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";
import { Tournament } from "@/types/projects";
import { CurrentUser } from "@/types/users";

type Props = {
  user?: CurrentUser | null;
  tournament: Tournament;
};

const TournamentSubscribeButton: FC<Props> = ({ user, tournament }) => {
  const t = useTranslations();
  const [isFollowing, setIsFollowing] = useState(
    () => tournament.is_subscribed
  );
  const [followQuestions, setFollowQuestions] = useState(
    () => tournament.follow_questions ?? false
  );
  const { setCurrentModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [modalMode, setModalMode] = useState<"follow" | "unfollow" | null>(
    null
  );

  const handleFollowClick = useCallback(() => {
    if (!user) {
      setCurrentModal({ type: "signup" });
    } else {
      setModalMode("follow");
    }
  }, [setCurrentModal, user]);

  const handleUnfollowClick = useCallback(() => {
    setModalMode("unfollow");
  }, []);

  const handleModalClose = useCallback(() => {
    setModalMode(null);
  }, []);

  const handleFollowSubmit = useCallback(
    async (shouldFollowQuestions: boolean) => {
      setIsLoading(true);
      try {
        await subscribeProject(tournament.id, {
          follow_questions: shouldFollowQuestions,
        });
        setIsFollowing(true);
        setFollowQuestions(shouldFollowQuestions);
        setModalMode(null);
      } finally {
        setIsLoading(false);
      }
    },
    [tournament.id]
  );

  const handleUnfollowSubmit = useCallback(
    async (shouldUnfollowQuestions: boolean) => {
      setIsLoading(true);
      try {
        await unsubscribeProject(tournament.id, {
          unfollow_questions: shouldUnfollowQuestions,
        });
        setIsFollowing(false);
        setFollowQuestions(false);
        setModalMode(null);
      } finally {
        setIsLoading(false);
      }
    },
    [tournament.id]
  );

  return (
    <>
      {user && isFollowing ? (
        <Button
          variant="primary"
          onClick={handleUnfollowClick}
          disabled={isLoading}
          className="border-blue-700 px-4 py-[5px] text-sm font-medium leading-5 text-blue-400 dark:border-blue-700-dark dark:text-blue-400-dark lg:text-base"
        >
          <FontAwesomeIcon icon={faBell} type="solid" />
          {t("unfollowButton")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={handleFollowClick}
          disabled={isLoading}
          className="border-blue-400 px-4 py-[5px] text-sm font-medium leading-5 text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark lg:text-base"
        >
          <FontAwesomeIcon icon={faBell} type="solid" />
          {t("followButton")}
        </Button>
      )}

      <TournamentSubscribeModal
        isOpen={modalMode !== null}
        onClose={handleModalClose}
        mode={modalMode ?? "follow"}
        defaultFollowQuestions={
          modalMode === "follow" ? followQuestions : followQuestions
        }
        onSubmit={
          modalMode === "follow" ? handleFollowSubmit : handleUnfollowSubmit
        }
        isLoading={isLoading}
      />
    </>
  );
};

export default TournamentSubscribeButton;
