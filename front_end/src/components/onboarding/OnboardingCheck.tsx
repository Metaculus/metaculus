"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/contexts/modal_context";

const OnboardingCheck: React.FC = () => {
  const searchParams = useSearchParams();
  const { setCurrentModal } = useModal();

  useEffect(() => {
    const startOnboarding = searchParams.get("start_onboarding");
    if (startOnboarding === "true") {
      // Remove the query parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("start_onboarding");
      window.history.replaceState({}, "", newUrl);

      // Start the onboarding process
      setCurrentModal({ type: "onboarding" });
    }
  }, [searchParams, setCurrentModal]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
