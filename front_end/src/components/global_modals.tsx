"use client";
import { FC } from "react";

import SignInModal from "@/components/auth/signin";
import SignUpModal from "@/components/auth/signup";
import { useModal } from "@/contexts/modal_context";

const GlobalModals: FC = () => {
  const { modalType, setModalType } = useModal();
  const onClose = () => setModalType(null);

  return (
    <>
      <SignInModal isOpen={modalType === "signin"} onClose={onClose} />
      <SignUpModal isOpen={modalType === "signup"} onClose={onClose} />
    </>
  );
};

export default GlobalModals;
