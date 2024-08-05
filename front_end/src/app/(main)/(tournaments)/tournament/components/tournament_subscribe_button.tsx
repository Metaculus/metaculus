"use client";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";

import {
  subscribeProject,
  unsubscribeProject,
} from "@/app/(main)/(tournaments)/tournament/[slug]/actions";
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
  const { setCurrentModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      setCurrentModal({ type: "signup" });
    } else {
      setIsLoading(true);

      try {
        await subscribeProject(tournament.id);
        setIsFollowing(true);
      } finally {
        setIsLoading(false);
      }
    }
  }, [setCurrentModal, tournament.id, user]);

  const handleUnsubscribe = useCallback(async () => {
    setIsLoading(true);

    try {
      await unsubscribeProject(tournament.id);
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  }, [tournament.id]);

  return (
    <>
      {user && isFollowing ? (
        <Button
          variant="primary"
          disabled={isLoading}
          onClick={handleUnsubscribe}
        >
          <FontAwesomeIcon icon={faBell} />
          {t("unfollowButton")}
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={handleSubscribe}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faBell} />
          {t("followButton")}
        </Button>
      )}
    </>
  );
};

export default TournamentSubscribeButton;
