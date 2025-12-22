"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { checkOnboardingAllowed } from "@/utils/onboarding";

const OnboardingCheck: React.FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  const { PUBLIC_ALLOW_TUTORIAL } = usePublicSettings();

  useEffect(() => {
    if (
      PUBLIC_ALLOW_TUTORIAL &&
      checkOnboardingAllowed() &&
      user?.id &&
      !user?.is_onboarding_complete &&
      !user?.is_bot
    ) {
      // Start the onboarding process
      setCurrentModal({ type: "onboarding" });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
