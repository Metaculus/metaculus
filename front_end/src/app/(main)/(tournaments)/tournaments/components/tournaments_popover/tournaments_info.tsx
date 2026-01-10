"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

type Props = {
  onClose: () => void;
};

const TournamentsInfo: React.FC<Props> = ({ onClose }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isLoggedOut = !user;
  const { setCurrentModal } = useModal();
  const handleSignup = () => setCurrentModal({ type: "signup", data: {} });

  const title = t.rich("tournamentsInfoTitle", {
    predmarket: (chunks) => (
      <Link
        href="/faq/#predmarket"
        className="text-blue-700 no-underline hover:underline dark:text-blue-700-dark"
      >
        {chunks}
      </Link>
    ),
  });

  return (
    <div className="relative rounded-[6px] bg-blue-400 p-5 dark:bg-blue-400-dark">
      <h6 className="my-0 text-base font-medium text-blue-900 dark:text-blue-900-dark">
        {title}
      </h6>

      <div className="mt-2.5 flex flex-wrap gap-2.5 text-xs font-medium text-blue-900 dark:text-blue-900-dark">
        <Link
          className="no-underline hover:underline"
          href="/help/scores-faq/#scores-section"
        >
          {t("tournamentsInfoScoringLink")}
        </Link>
        <Link
          className="no-underline hover:underline"
          href="/help/scores-faq/#tournaments-section"
        >
          {t("tournamentsInfoPrizesLink")}
        </Link>
      </div>

      {isLoggedOut && (
        <Button
          size="xs"
          onClick={handleSignup}
          className="mt-2.5 h-5 bg-transparent hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
        >
          {t("tournamentsInfoCta")}
        </Button>
      )}

      <Button
        presentationType="icon"
        size="sm"
        variant="text"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute right-2.5 top-2.5 text-lg text-blue-900 opacity-50 dark:text-blue-900-dark dark:opacity-50"
      >
        <FontAwesomeIcon icon={faXmark} />
      </Button>
    </div>
  );
};

export default TournamentsInfo;
