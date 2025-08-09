"use client";

import { FC, useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Tournament } from "@/types/projects";

type Props = {
  tournament: Tournament;
};

const AnonymousForecastingCheck: FC<Props> = ({ tournament }) => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  useEffect(() => {
    if (
      tournament.allow_anonymous_forecasting &&
      tournament.is_ongoing &&
      !user
    ) {
      setCurrentModal({ type: "signupAnonymous" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return null; // This component doesn't render anything
};

export default AnonymousForecastingCheck;
