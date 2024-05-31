"use client";

import { FC } from "react";

import { useModal } from "@/contexts/modal_context";

const AuthButton: FC = () => {
  const { modalType, setModalType } = useModal();

  return (
    <>
      <button
        className="w-full px-4 py-1.5 text-center hover:bg-metac-blue-400-dark lg:mx-2 lg:rounded-full lg:bg-metac-blue-200 lg:px-2 lg:py-0 lg:text-metac-blue-900 lg:hover:bg-metac-blue-100"
        onClick={() => setModalType("signin")}
      >
        Log In
      </button>
    </>
  );
};

export default AuthButton;
