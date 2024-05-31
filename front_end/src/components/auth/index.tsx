"use client";

import { FC, useState } from "react";

import SigninComponent from "@/components/auth/signin";
import BaseModal from "@/components/base_modal";

const AuthButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        className="w-full px-4 py-1.5 text-center hover:bg-metac-blue-400-dark lg:mx-2 lg:rounded-full lg:bg-metac-blue-200 lg:px-2 lg:py-0 lg:text-metac-blue-900 lg:hover:bg-metac-blue-100"
        onClick={() => setModalOpen(true)}
      >
        Log In
      </button>
      <BaseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <SigninComponent></SigninComponent>
      </BaseModal>
    </>
  );
};

export default AuthButton;
