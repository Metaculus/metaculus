"use client";
import React, { FC } from "react";

import ResetPasswordModal, {
  ResetPasswordConfirmModal,
} from "@/components/auth/password_reset";
import SignInModal from "@/components/auth/signin";
import SignUpModal, { SignUpModalSuccess } from "@/components/auth/signup";
import { useModal } from "@/contexts/modal_context";

import ConfirmModal from "./confirm_modal";
import ContactUsModal from "./contact_us_modal";

const GlobalModals: FC = () => {
  const { currentModal, setCurrentModal } = useModal();
  const onClose = () => setCurrentModal(null);

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
      />
      <ConfirmModal
        isOpen={currentModal?.type === "confirm"}
        onClose={onClose}
        onConfirm={currentModal?.data?.onConfirm}
      />
    </>
  );
};

export default GlobalModals;
