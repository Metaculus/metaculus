"use client";

import React from "react";
import { useModal } from "@/contexts/modal_context";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

const OnboardingModalWrapper: React.FC = () => {
  const { currentModal, setCurrentModal } = useModal();

  return (
    <OnboardingModal
      isOpen={currentModal?.type === "onboarding"}
      onClose={() => setCurrentModal(null)}
    />
  );
};

export default OnboardingModalWrapper;
