"use client";
import React, { FC } from "react";

import ResetPasswordModal, {
  ResetPasswordConfirmModal,
} from "@/components/auth/password_reset";
import SignInModal from "@/components/auth/signin";
import SignUpModal, { SignUpModalSuccess } from "@/components/auth/signup";
import { useModal } from "@/contexts/modal_context";

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
    </>
  );
};

export default GlobalModals;
