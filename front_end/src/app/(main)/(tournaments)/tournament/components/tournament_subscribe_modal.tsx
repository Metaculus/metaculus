"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mode: "follow" | "unfollow";
  defaultFollowQuestions?: boolean;
  onSubmit: (followQuestions: boolean) => void;
  isLoading: boolean;
};

const TournamentSubscribeModal: FC<Props> = ({
  isOpen,
  onClose,
  mode,
  defaultFollowQuestions = false,
  onSubmit,
  isLoading,
}) => {
  const t = useTranslations();
  const [followQuestions, setFollowQuestions] = useState(defaultFollowQuestions);

  const isFollow = mode === "follow";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => onClose()}
      label={
        isFollow
          ? t("tournamentFollowModalTitle")
          : t("tournamentUnfollowModalTitle")
      }
      className="max-w-sm"
    >
      <p className="my-3 text-gray-700 dark:text-gray-700-dark">
        {isFollow
          ? t("tournamentFollowModalDescription")
          : t("tournamentUnfollowModalDescription")}
      </p>

      <div className="my-4">
        <Checkbox
          checked={followQuestions}
          onChange={setFollowQuestions}
          label={
            isFollow
              ? t("tournamentFollowModalAlsoFollowQuestions")
              : t("tournamentUnfollowModalAlsoUnfollowQuestions")
          }
        />
        <p className="ml-7 mt-1 text-xs text-gray-500 dark:text-gray-500-dark">
          {isFollow
            ? t("tournamentFollowModalAlsoFollowQuestionsDescription")
            : t("tournamentUnfollowModalAlsoUnfollowQuestionsDescription")}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="tertiary" onClick={onClose} disabled={isLoading}>
          {t("cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={() => onSubmit(followQuestions)}
          disabled={isLoading}
        >
          {isFollow
            ? t("tournamentFollowModalSubmit")
            : t("tournamentUnfollowModalSubmit")}
        </Button>
      </div>
    </BaseModal>
  );
};

export default TournamentSubscribeModal;
