"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { checkOnboardingAllowed } from "@/utils/onboarding";

const OnboardingCheck: React.FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  const allowTutorial = (process.env.ALLOW_TUTORIAL || "true") === "true";

  useEffect(() => {
    if (
      allowTutorial &&
      checkOnboardingAllowed() &&
      user?.id &&
      !user?.is_onboarding_complete
    ) {
      // Start the onboarding process
      setCurrentModal({ type: "onboarding" });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
