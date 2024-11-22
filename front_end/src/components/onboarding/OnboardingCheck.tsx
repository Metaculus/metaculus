"use client";

import { useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

const OnboardingCheck: React.FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id && !user?.is_onboarding_complete) {
      // Start the onboarding process
      setCurrentModal({ type: "onboarding" });
    }
  }, [user?.id]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
