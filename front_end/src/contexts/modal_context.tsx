"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

export type ModalType =
  | "signin"
  | "signup"
  | "signupAnonymous"
  | "signupSuccess"
  | "resetPassword"
  | "resetPasswordConfirm"
  | "contactUs"
  | "onboarding"
  | "confirm"
  | "accountInactive";

export type CurrentModal = {
  type: ModalType;
  data?: Record<string, any>;
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
