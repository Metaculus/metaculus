"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/contexts/modal_context";
import { useAuth } from "@/contexts/auth_context";

const OnboardingCheck: React.FC = () => {
  const searchParams = useSearchParams();
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  useEffect(() => {
    const startOnboarding = searchParams.get("start_onboarding");
    if (startOnboarding === "true") {
      // Remove the query parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("start_onboarding");
      window.history.replaceState({}, "", newUrl);

      // Check if the user is logged in
      if (user) {
        // Start the onboarding process
        setCurrentModal({ type: "onboarding" });
      } else {
        // Show the registration modal
        setCurrentModal({ type: "signup" });
      }
    }
  }, [searchParams, setCurrentModal, user]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
