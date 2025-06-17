"use client";
import dynamic from "next/dynamic";
import React, { FC } from "react";

import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";

const SignInModal = dynamic(() => import("@/components/auth/signin"), {
  ssr: false,
});

const SignUpModal = dynamic(
  () => import("@/components/auth/signup").then((mod) => mod.SignUpModal),
  {
    ssr: false,
  }
);

const SignUpModalSuccess = dynamic(
  () =>
    import("@/components/auth/signup").then((mod) => mod.SignUpModalSuccess),
  {
    ssr: false,
  }
);

const AccountInactive = dynamic(
  () => import("@/components/auth/signup").then((mod) => mod.AccountInactive),
  {
    ssr: false,
  }
);

const ResetPasswordModal = dynamic(
  () => import("@/components/auth/password_reset"),
  {
    ssr: false,
  }
);

const ResetPasswordConfirmModal = dynamic(
  () =>
    import("@/components/auth/password_reset").then(
      (mod) => mod.ResetPasswordConfirmModal
    ),
  {
    ssr: false,
  }
);

const ContactUsModal = dynamic(() => import("@/components/contact_us_modal"), {
  ssr: false,
});

const OnboardingModal = dynamic(
  () => import("@/components/onboarding/onboarding_modal"),
  {
    ssr: false,
  }
);

const ConfirmModal = dynamic(() => import("@/components/confirm_modal"), {
  ssr: false,
});

const GlobalModals: FC = () => {
  const { currentModal, setCurrentModal } = useModal();
  const onClose = () => setCurrentModal(null);

  const { PUBLIC_ALLOW_TUTORIAL } = usePublicSettings();

  return (
    <>
      {currentModal?.type === "signin" && (
        <SignInModal
          isOpen={currentModal?.type === "signin"}
          onClose={onClose}
        />
      )}
      {currentModal?.type === "signup" && (
        <SignUpModal
          isOpen={currentModal?.type === "signup"}
          onClose={onClose}
        />
      )}
      {currentModal?.type === "signupSuccess" && (
        <SignUpModalSuccess
          isOpen={currentModal?.type === "signupSuccess"}
          onClose={onClose}
          username={currentModal?.data?.username}
          email={currentModal?.data?.email}
        />
      )}
      {currentModal?.type === "accountInactive" && (
        <AccountInactive
          isOpen={currentModal?.type === "accountInactive"}
          onClose={onClose}
          login={currentModal?.data?.login}
        />
      )}
      {currentModal?.type === "resetPassword" && (
        <ResetPasswordModal
          isOpen={currentModal?.type === "resetPassword"}
          onClose={onClose}
        />
      )}
      {currentModal?.type === "resetPasswordConfirm" && (
        <ResetPasswordConfirmModal
          isOpen={currentModal?.type === "resetPasswordConfirm"}
          onClose={onClose}
        />
      )}
      {currentModal?.type === "contactUs" && (
        <ContactUsModal
          isOpen={currentModal?.type === "contactUs"}
          onClose={onClose}
        />
      )}
      {PUBLIC_ALLOW_TUTORIAL && currentModal?.type === "onboarding" && (
        <OnboardingModal
          isOpen={currentModal?.type === "onboarding"}
          onClose={() => setCurrentModal(null)}
        />
      )}
      {currentModal?.type === "confirm" && (
        <ConfirmModal
          isOpen={currentModal?.type === "confirm"}
          onClose={onClose}
          onConfirm={currentModal?.data?.onConfirm}
        />
      )}
    </>
  );
};

export default GlobalModals;
