"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { QuestionLinkDirection, QuestionLinkStrength } from "@/types/coherence";
import { CommentType } from "@/types/comment";
import { CurrentUser } from "@/types/users";

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
  | "disputeKeyFactor"
  | "copyQuestionLink";

type ModalDataByType = {
  signin: {
    onSuccess?: (authenticatedUser: CurrentUser) => void | Promise<void>;
  };
  signup: {
    onSuccess?: (authenticatedUser: CurrentUser) => void | Promise<void>;
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
  copyQuestionLink: {
    fromQuestionTitle: string;
    toQuestionTitle: string;
    defaultDirection?: QuestionLinkDirection;
    defaultStrength?: QuestionLinkStrength;
    targetElementId?: string;
    onCreate?: (payload: {
      direction: QuestionLinkDirection;
      strength: QuestionLinkStrength;
      swapped: boolean;
    }) => void;
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
