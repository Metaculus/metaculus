"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { useNavigation } from "@/contexts/navigation_context";

const OnboardingCheck: React.FC = () => {
  const { setCurrentModal } = useModal();
  const { user } = useAuth();
  const { previousPath, currentPath } = useNavigation();
  const pathname = usePathname();

  // We want to avoid situations where a user skips the tutorial
  // on the homepage, navigates directly to the questions feed,
  // and then sees the tutorial pop up again (or vice versa).
  // To handle this, we simply check that the previous page
  // wasn’t the home or questions page.
  const previousPathHasTutorial =
    previousPath &&
    ["/", "/questions/"].includes(
      new URL(previousPath, process.env.APP_URL).pathname
    );

  useEffect(() => {
    // Checks if the hook has already been refreshed.
    // Sometimes, it takes a moment for useNavigation to update from the previous route's values,
    // so we need to perform this check to ensure we have updated values of previousPath
    const hookUpdated = currentPath === pathname;

    if (
      hookUpdated &&
      user?.id &&
      !user?.is_onboarding_complete &&
      !previousPathHasTutorial
    ) {
      // Start the onboarding process
      setCurrentModal({ type: "onboarding" });
    }
  }, [user?.id, currentPath]);

  return null; // This component doesn't render anything
};

export default OnboardingCheck;
