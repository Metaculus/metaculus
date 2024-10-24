"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useModal } from "@/contexts/modal_context";
import { useAuth } from "@/contexts/auth_context";

const OnboardingCheck: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setCurrentModal } = useModal();
  const { user } = useAuth();

  const handleOnboarding = useCallback(() => {
    const startOnboarding = searchParams.get("start_onboarding");
    if (startOnboarding === "true") {
      // Remove the query parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("start_onboarding");
      router.replace(newUrl.toString());

      // Check if the user is logged in
      if (user) {
        // Start the onboarding process
        setCurrentModal({ type: "onboarding" });
      } else {
        // Show the registration modal
        setCurrentModal({ type: "signup" });
      }
    }
  }, [searchParams, router, user, setCurrentModal]);

  useEffect(() => {
    handleOnboarding();
  }, [handleOnboarding]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
