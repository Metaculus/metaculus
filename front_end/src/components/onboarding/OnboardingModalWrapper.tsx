"use client";

import React from "react";

import OnboardingModal from "@/components/onboarding/OnboardingModal";
import { useModal } from "@/contexts/modal_context";

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
