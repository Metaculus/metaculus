"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { CommentType } from "@/types/comment";

export type ModalType =
  | "signin"
  | "signup"
  | "signupSuccess"
  | "resetPassword"
  | "resetPasswordConfirm"
  | "contactUs"
  | "onboarding"
  | "confirm"
  | "accountInactive"
  | "disputeKeyFactor";

type ModalDataByType = {
  signin: Record<string, never>;
  signup: {
    forceIsBot?: boolean;
  };
  signupSuccess: { username: string; email: string };
  resetPassword: Record<string, never>;
  resetPasswordConfirm: Record<string, never>;
  contactUs: Record<string, never>;
  onboarding: Record<string, never>;
  confirm: {
    title: string;
    description?: string;
    actionText?: string;
    onConfirm: () => void;
    onClose?: () => void;
  };
  accountInactive: { login: string };
  disputeKeyFactor: {
    keyFactorId: number;
    parentCommentId: number;
    postId: number;
    onOptimisticAdd: (text: string) => number | Promise<number>;
    onFinalize: (tempId: number, real: CommentType) => void;
    onRemove: (tempId: number) => void;
  };
};

export type CurrentModal<T extends ModalType = ModalType> = {
  type: T;
  data?: ModalDataByType[T];
};

export type CurrentModalContextType = {
  currentModal: CurrentModal | null;
  setCurrentModal: (type: CurrentModal | null) => void;
};

export const ModalContext = createContext<CurrentModalContextType>({
  currentModal: null,
  setCurrentModal: () => {},
});

const ModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [currentModal, setCurrentModal] = useState<CurrentModal | null>(null);

  return (
    <ModalContext.Provider value={{ currentModal, setCurrentModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);
export default ModalProvider;
