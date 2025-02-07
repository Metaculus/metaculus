"use client";
import React, { FC } from "react";

import ResetPasswordModal, {
  ResetPasswordConfirmModal,
} from "@/components/auth/password_reset";
import SignInModal from "@/components/auth/signin";
import SignUpModal, {
  AccountInactive,
  SignUpModalSuccess,
} from "@/components/auth/signup";
import OnboardingModal from "@/components/onboarding/onboarding_modal";
import { useModal } from "@/contexts/modal_context";

import ConfirmModal from "./confirm_modal";
import ContactUsModal from "./contact_us_modal";
import { getPublicSettings } from "@/utils/public-settings";

const GlobalModals: FC = () => {
  const { currentModal, setCurrentModal } = useModal();
  const onClose = () => setCurrentModal(null);

  const { PUBLIC_ALLOW_TUTORIAL } = getPublicSettings();

  return (
    <>
      <SignInModal isOpen={currentModal?.type === "signin"} onClose={onClose} />
      <SignUpModal isOpen={currentModal?.type === "signup"} onClose={onClose} />
      <SignUpModalSuccess
        isOpen={currentModal?.type === "signupSuccess"}
        onClose={onClose}
        username={currentModal?.data?.username}
        email={currentModal?.data?.email}
      />
      <AccountInactive
        isOpen={currentModal?.type === "accountInactive"}
        onClose={onClose}
        login={currentModal?.data?.login}
      />
      <ResetPasswordModal
        isOpen={currentModal?.type === "resetPassword"}
        onClose={onClose}
      />
      <ResetPasswordConfirmModal
        isOpen={currentModal?.type === "resetPasswordConfirm"}
        onClose={onClose}
      />
      <ContactUsModal
        isOpen={currentModal?.type === "contactUs"}
        onClose={onClose}
      />{" "}
      {PUBLIC_ALLOW_TUTORIAL && (
        <OnboardingModal
          isOpen={currentModal?.type === "onboarding"}
          onClose={() => setCurrentModal(null)}
        />
      )}
      <ConfirmModal
        isOpen={currentModal?.type === "confirm"}
        onClose={onClose}
        onConfirm={currentModal?.data?.onConfirm}
      />
    </>
  );
};

export default GlobalModals;
